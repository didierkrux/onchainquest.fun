declare module '@parcnet-js/app-connector' {
  export interface ParcnetAPI {
    gpc: {
      prove: (options: any) => Promise<any>;
    };
  }
}

declare module '@parcnet-js/app-connector-react' {
  import { ReactNode } from 'react';

  export interface ZappConfig {
    name: string;
    permissions: {
      REQUEST_PROOF: { collections: string[] };
      READ_PUBLIC_IDENTIFIERS: {};
    };
  }

  export interface ParcnetClientProviderProps {
    zapp: ZappConfig;
    children: ReactNode;
  }

  export function ParcnetClientProvider(props: ParcnetClientProviderProps): JSX.Element;
  export function Toolbar(): JSX.Element;
  export function useParcnetClient(): {
    z: any;
    connectionState: string;
  };

  export enum ClientConnectionState {
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING'
  }
}

declare module '@parcnet-js/ticket-spec' {
  export function ticketProofRequest(config: any): {
    schema: any;
    getProofRequest: () => any;
  };
}

declare module '@pcd/gpc' {
  export function gpcVerify(proof: any, config: any, claims: any, artifactsPath: string): Promise<boolean>;
  export function boundConfigToJSON(config: any): string;
  export function revealedClaimsToJSON(claims: any): string;
  export function boundConfigFromJSON(json: string): any;
  export function revealedClaimsFromJSON(json: string): any;

  export interface GPCBoundConfig {
    circuitIdentifier: string;
  }

  export interface GPCRevealedClaims {
    pods?: {
      ticket?: {
        entries?: {
          attendeeName?: { value?: any };
          attendeeEmail?: { value?: any };
          eventId?: { value?: any };
        };
      };
    };
  }

  export interface GPCProof {
    // Add proof structure as needed
  }
}

declare module 'ffjavascript' {
  export function getCurveFromName(name: string, options?: any): any;
} 
