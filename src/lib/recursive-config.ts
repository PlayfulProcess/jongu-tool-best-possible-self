import recursiveConfig from '../../recursive.config.json';

export interface RecursiveConfig {
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
export const config: RecursiveConfig = {
  ...recursiveConfig,
  features: {
    ...recursiveConfig.features,
    discord: {
      ...recursiveConfig.features.discord,
      serverId: process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || recursiveConfig.features.discord.serverId,
    },
    donations: {
      ...recursiveConfig.features.donations,
      stripeLink: process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK || recursiveConfig.features.donations.stripeLink,
    },
  },
};