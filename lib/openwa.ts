export interface OpenWAConfig {
  baseUrl: string;
  apiKey: string;
}

export interface StartSessionResponse {
  qrCode?: string;
  sessionId: string;
  status: string;
}

export class OpenWAClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config?: OpenWAConfig) {
    this.baseUrl = (config?.baseUrl || process.env.OPENWA_BASE_URL || "").replace(/\/$/, "");
    this.apiKey = config?.apiKey || process.env.OPENWA_API_KEY || "";

    if (!this.baseUrl) {
      console.warn("[OpenWA] OPENWA_BASE_URL is not configured");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey, // OpenWA uses X-Api-Key header
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenWA API error ${response.status}: ${errorText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) as T : {} as T;
    } catch (error) {
      console.error(`[OpenWA] Request failed: ${url}`, error);
      throw error;
    }
  }

  async getSessions() {
    return this.request<any[]>("/api/sessions");
  }

  async startSession(sessionName: string): Promise<StartSessionResponse> {
    let sessionId = "";
    let status = "";
    
    try {
      // 1. Start the session in OpenWA
      const created = await this.request<any>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ name: sessionName }),
      });
      
      sessionId = created.id || created.name;
      status = created.status || "PENDING";

      // 2. Register Webhook
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      try {
        await this.request("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            sessionId: sessionName,
            url: `${appUrl}/api/v1/webhooks/openwa/incoming`,
            events: ["message"]
          }),
        });
      } catch (webhookErr) {
        console.warn(`[OpenWA] Webhook setup failed for ${sessionName}, but session started`);
      }
      
      // 3. Give it a moment to generate QR
      await new Promise(r => setTimeout(r, 2000));
      
      let qrCode: string | undefined;
      try {
        const qrRes = await this.request<any>(`/api/sessions/${sessionName}/qr`, {
          headers: { Accept: "application/json" }
        });
        qrCode = qrRes.qrCode || qrRes.qr;
      } catch (e) {
        console.log(`[OpenWA] QR not ready yet for ${sessionName}`);
      }

      return { sessionId: sessionName, status, qrCode };
    } catch (e) {
      console.error("[OpenWA] Failed to start session", e);
      throw e;
    }
  }

  async sendText(sessionName: string, to: string, text: string) {
    const chatId = to.includes("@") ? to : `${to}@c.us`;
    
    return this.request("/api/sendText", {
      method: "POST",
      body: JSON.stringify({
        session: sessionName,
        chatId,
        text,
      }),
    });
  }

  async closeSession(sessionName: string) {
    return this.request(`/api/sessions/${sessionName}/stop`, {
      method: "POST",
    });
  }
}

// Singleton
let defaultClient: OpenWAClient | null = null;
export function getOpenWAClient(): OpenWAClient {
  if (!defaultClient) {
    defaultClient = new OpenWAClient();
  }
  return defaultClient;
}
