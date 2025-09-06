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
    discord?: string;
    twitter: string;
  };
}

// Merge environment variables with config
export const config: JonguConfig = {
  ...jonguConfig,
  features: {
    ...jonguConfig.features,
    discord: {
      ...jonguConfig.features.discord,
      serverId: process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || jonguConfig.features.discord.serverId,
    },
    donations: {
      ...jonguConfig.features.donations,
      stripeLink: process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK || jonguConfig.features.donations.stripeLink,
    },
  },
};