import {
  User,
  Resume,
  AIResumeProfile,
  Gig,
  GigRecommendation,
  ChatConversation,
  ChatMessage
} from "../types";

const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    // If deployed on Vercel or custom domain, default to the current origin /api
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `${window.location.origin}/api`;
    }
  }
  return "http://localhost:8000/api";
};

class ApiService {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("peaklyy_token");
  }

  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("peaklyy_token", token);
    }
  }

  removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("peaklyy_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Unauthorized, clear stale token
      this.removeToken();
    }

    if (!res.ok) {
      let errorMessage = `Request failed (${res.status})`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Ignored
      }
      throw new Error(errorMessage);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  // --- Auth APIs ---
  async register(name: string, email: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  logout() {
    this.removeToken();
  }

  // --- Resumes APIs ---
  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<Resume>("/resumes/upload", {
      method: "POST",
      body: formData,
    });
  }

  async getUserResumes(): Promise<Resume[]> {
    return this.request<Resume[]>("/resumes");
  }

  async getResumeAnalysis(resumeId: number): Promise<AIResumeProfile> {
    return this.request<AIResumeProfile>(`/resumes/${resumeId}/analysis`);
  }

  async triggerAnalysis(resumeId: number): Promise<AIResumeProfile> {
    return this.request<AIResumeProfile>(`/resumes/${resumeId}/analyze`, {
      method: "POST",
    });
  }

  // --- Gigs APIs ---
  async listGigs(category?: string, experienceLevel?: string, search?: string): Promise<Gig[]> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (experienceLevel) params.append("experience_level", experienceLevel);
    if (search) params.append("search", search);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Gig[]>(`/gigs${query}`);
  }

  async getGig(gigId: number): Promise<Gig> {
    return this.request<Gig>(`/gigs/${gigId}`);
  }

  // --- Recommendations APIs ---
  async getRecommendations(): Promise<GigRecommendation[]> {
    return this.request<GigRecommendation[]>("/recommendations");
  }

  async refreshRecommendations(): Promise<{ count: number; message: string; recommendations: GigRecommendation[] }> {
    return this.request<{ count: number; message: string; recommendations: GigRecommendation[] }>("/recommendations/refresh", {
      method: "POST",
    });
  }

  async getGigRecommendation(gigId: number): Promise<GigRecommendation> {
    return this.request<GigRecommendation>(`/recommendations/${gigId}`);
  }

  // --- AI Career Assistant APIs ---
  async sendChatMessage(message: string, conversationId?: number): Promise<{ conversation_id: number; message: ChatMessage }> {
    return this.request<{ conversation_id: number; message: ChatMessage }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  }

  async listConversations(): Promise<ChatConversation[]> {
    return this.request<ChatConversation[]>("/ai/conversations");
  }

  async getConversation(conversationId: number): Promise<ChatConversation> {
    return this.request<ChatConversation>(`/ai/conversations/${conversationId}`);
  }

  async deleteConversation(conversationId: number): Promise<void> {
    return this.request<void>(`/ai/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiService();
