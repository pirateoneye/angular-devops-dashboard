export interface UserMessi {
    self: string;
    id: string;
    origin: string;
    createdTimestamp: string;
    username:string;
    enabled: boolean;
    totp: boolean;
    emailVerified: boolean;
    firstName: string;
    lastName: string;
    email: string;
    federationLink: string;
    serviceAccountClientId: string;
    attributes: any;
    credentials: string;
    disableableCredentialTypes: any;
    requiredActions: any;
    federatedIdentities: string;
    realmRoles: string;
    clientRoles: {
        "bca-mcb": string[];
        "bca-qrms"?: string[];
        "account"?: string[];
    };
    clientConsents: string;
    notBefore: number;
    applicationRoles: string;
    socialLinks: string;
    groups: string;
    access: any;
}