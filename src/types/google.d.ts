/* Google Identity Services + GAPI type stubs */

declare namespace google.accounts.oauth2 {
  interface TokenClient {
    callback: (resp: TokenResponse) => void;
    requestAccessToken: (opts?: { prompt?: string }) => void;
  }

  interface TokenResponse {
    access_token: string;
    error?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }

  function initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (resp: TokenResponse) => void;
  }): TokenClient;

  function revoke(token: string, done: () => void): void;
}

declare namespace gapi {
  function load(api: string, callback: () => void): void;

  namespace client {
    function init(config: {
      apiKey: string;
      discoveryDocs: string[];
    }): Promise<void>;

    function getToken(): { access_token: string } | null;
    function setToken(token: null): void;

    namespace calendar.events {
      function list(
        params: Record<string, any>,
      ): Promise<{ result: { items?: any[] } }>;
      function insert(params: Record<string, any>): Promise<{ result: any }>;
      function delete_(params: Record<string, any>): Promise<void>;
      function patch(params: Record<string, any>): Promise<{ result: any }>;

        export function delete(arg0: { calendarId: string; eventId: string; }) {
            throw new Error("Function not implemented.");
        }
    }
  }
}
