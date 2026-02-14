export type Language = 'en' | 'da' | 'de';
export type Theme = 'light' | 'dark';
export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'x' | 'youtube';
export type TeamMemberRole = 'admin' | 'member';
export type AppState = 'dashboard' | 'onboarding_company_info' | 'onboarding_analysis' | 'onboarding_goals' | 'onboarding_strategy' | 'onboarding_plan' | 'media_library' | 'calendar' | 'partners' | 'prospecting' | 'drip_campaigns' | 'leads' | 'analytics' | 'growth' | 'users' | 'integrations' | 'company_details';

export interface User { id: string; email: string; partnerAccess?: { companyId: string; partnerId: string }[]; }
export interface Company { id: string; name: string; website: string; updatedAt?: string; language?: Language; description?: string; industry?: string; targetAudience?: string; valueProposition?: string; goals?: string; brandVoice?: any; members?: any[]; partners: any[]; contentStrategy?: string; isContentStrategyLocked?: boolean; mediaLibrary?: any[]; events?: any[]; savedGrowthPlans?: any[]; growthPlan?: any; }
export interface Partner { id: string; name: string; website: string; language: Language; status: 'pending' | 'processing' | 'completed' | 'error'; logoUrl?: string; description?: string; contacts?: any[]; socials?: any; connections?: any[]; isLocked?: boolean; originalPlanPdfAssetId?: string; savedProposals?: any[]; }
export interface AssetMetadata { id: string; fileName: string; type: 'image' | 'video' | 'document'; tags?: string[]; aiTags?: string[]; tagsStatus?: 'pending' | 'completed'; }
export interface CalendarEvent { id: string; date: string; assetId: string; assetName: string; time: string; campaignId?: string; postsByPartner: Record<string, any>; }
export interface AppCalendarEvent extends CalendarEvent { assetDataUrl?: string; assetType?: 'image' | 'video' | 'document'; }