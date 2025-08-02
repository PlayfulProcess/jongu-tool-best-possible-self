import jonguConfig from '../../jongu.config.json';

export interface JonguConfig {
  channel: {
    name: string;
    tagline: string;
    description: string;
    author: string;
    authorLink: string;
  };
  features: {
    discord: {
      enabled: boolean;
      serverId: string;
      showWidget: boolean;
    };
    donations: {
      enabled: boolean;
      stripeLink: string;
      buttonText: string;
    };
    newsletter: {
      enabled: boolean;
      provider: string;
    };
    communityTools: {
      enabled: boolean;
      requireApproval: boolean;
    };
  };
  theme: {
    primaryColor: string;
    accentColor: string;
    style: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  links: {
    github: string;
    discord: string;
    twitter: string;
  };
}

export const config: JonguConfig = jonguConfig;