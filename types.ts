/**
 * Global Type Definitions for BrandPortal-AI SaaS Platform
 */

export type Language = 'en' | 'da' | 'de';
export type Theme = 'light' | 'dark';

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'x' | 'youtube';

export type TeamMemberRole = 'admin' | 'member';

/**
 * Navigation states for the single page application
 */
export type AppState = 
  | 'dashboard' 
  | 'onboarding_company_info' 
  | 'onboarding_analysis' 
  | 'onboarding_goals' 
  | 'onboarding_strategy' 
  | 'onboarding_plan' 
  | 'media_library' 
  | 'calendar' 
  | 'partners' 
  | 'prospecting' 
  | 'drip_campaigns' 
  | 'leads' 
  | 'analytics' 
  | 'growth' 
  | 'users' 
  | 'integrations' 
  | 'company_details' 
  | 'partner_portal_simulation';

export interface Contact {
  id: string;
  name: string;
  role: string;
  email?: string;
  linkedin?: string;
  hasAccess?: boolean;
}

export interface Connection {
  platform: SocialPlatform;
  accountName: string;
}

export interface BrandVoice {
  toneOfVoice: string;
  dos: string[];
  donts: string[];
  examples: string;
}

export interface SuccessStory {
  id: string;
  projectName: string;
  description: string;
  status: 'new' | 'approved' | 'rejected' | 'featured';
  submittedAt: string;
  caseStudySnippet?: string;
}

export interface AnalyticsSummary {
  totalReach: number;
  avgEngagementRate: number;
}

export interface KPI {
  name: string;
  baseline?: string;
  target: string;
  deadline?: string;
}

export interface SWOTAnalysis {
  summary?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface TimelinePhase {
  phase: string;
  actions: string[];
}

export interface CompetitorAnalysis {
  name: string;
  usp: string;
  strength: string;
  weakness: string;
}

export interface BudgetItem {
  category: string;
  description: string;
  estimatedCost: string;
  priority: string;
}

export interface LandingPageContent {
  nav?: { links: string[]; logoUrl?: string };
  hero: { 
    title: string; 
    subtitle: string; 
    ctaButton: string; 
    secondaryButton: string; 
    backgroundImageUrl?: string 
  };
  about?: { title: string; text: string };
  footer?: { text: string };
}

export type DripStepType = 'VIEW_PROFILE' | 'SEND_CONNECTION_REQUEST' | 'LIKE_POST' | 'SEND_MESSAGE';

export interface DripStep {
  id: string;
  type: DripStepType;
  delayDays: number;
  messageTemplate?: string;
}

export interface DripCampaign {
  id: string;
  name: string;
  steps: DripStep[];
  // Fix: Add goal, startDate, endDate, themeColor as required by CampaignModal
  goal: string;
  startDate: string;
  endDate: string;
  themeColor: string;
}

export interface ActiveDripCampaign {
  id: string;
  campaignId: string;
  contactId: string;
  partnerId: string;
  currentStepIndex: number;
  status: 'active' | 'paused' | 'completed';
}

export interface PartnerIdea {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  link?: string;
  submittedBy: 'company' | 'partner';
  timestamp: string;
  status: 'new' | 'viewed' | 'in_progress' | 'used' | 'archived';
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  goals: string;
  challenges: string;
  searchBehavior: string;
}

export interface Solution {
  id: string;
  name: string;
  customerChallenges: string;
  targetIndustries: string[];
  relevantPartnerIds: string[];
}

export type LaunchpadActionType = 'GENERATE_LANDING_PAGE' | 'GENERATE_ARTICLE' | 'GENERATE_SEO_STRATEGY' | 'GENERATE_SOCIAL_POSTS';

export interface LaunchpadAction {
  type: LaunchpadActionType;
  context: any;
}

export type WorkflowStepType = 'CREATE_CAMPAIGN' | 'CREATE_SOLUTION' | 'CREATE_PERSONA' | 'SUMMARY';

export interface WorkflowStep {
  title: string;
  description: string;
  type: WorkflowStepType;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface ActiveWorkflow {
  workflowId: string;
  currentStepIndex: number;
  context: any;
}

export interface IndustryPage {
  id: string;
  name: string;
  industry: string;
}

export interface SavedLandingPage {
  id: string;
  name: string;
  industry: string;
  content: LandingPageContent;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
}

export interface StrategicInitiative {
  id: string;
  title: string;
  description: string;
}

export interface ProspectProposal {
  id: string;
  name: string;
  prospectId: string;
  language: Language;
  prospectName: string;
  prospectWebsite: string;
  prospectLogoUrl?: string;
  companyLogoUrl?: string; 
  companyName: string;
  brandColors: { primary: string; secondary: string };
  introduction: { title: string; executiveSummary: string };
  platformOverview: { title: string; introduction?: string; items: { title: string; text: string }[] };
  analysis: { 
    title: string; 
    personaStrategy?: string; 
    icp?: { focus: string[]; decisionMakers: string[] }; 
    toneOfVoice: { description: string; dos: string[]; donts: string[] } 
  };
  strategy: { pillars: { title: string; description: string }[] };
  // Fix: Changed businessGoals to businessPairs to match docGenerator and db.ts
  businessPairs?: { kpis: KPI[]; swot?: SWOTAnalysis }; 
  certifications?: { name: string; marketRequirement: string; deadline: string }[];
  implementationPlan?: TimelinePhase[];
  implementationPlanIntro?: string;
  competitors?: CompetitorAnalysis[];
  contentExamples?: { 
    assetId: string; 
    imagePrompt: string; 
    assetBase64?: string; 
    posts: { platform: SocialPlatform; text: string }[] 
  }[];
  landingPageContent?: LandingPageContent;
  budget?: { title: string; summary: string; items: BudgetItem[] };
  nextSteps?: { title: string; body: string };
  customSections?: { id: string; title: string; body: string }[];
  sectionOrder?: string[];
  hiddenSections?: string[];
  deletedSections?: string[];
  lockedSections?: string[];
  pageBreaks?: string[];
}

export interface Partner {
  id: string;
  name: string;
  website: string;
  description?: string;
  language: Language;
  logoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  industry?: string;
  targetAudience?: string;
  valueProposition?: string;
  cvr?: string;
  addresses?: { type: string, address: string }[];
  financials?: { year: number, revenue?: string, result?: string, equity?: string }[];
  role?: string;
  themeColor?: string;
  contacts?: Contact[];
  socials?: Partial<Record<SocialPlatform, string>>;
  connections?: Connection[];
  brandVoice?: BrandVoice;
  successStories?: SuccessStory[];
  analyticsSummary?: AnalyticsSummary;
  isLocked?: boolean;
  savedProposals?: ProspectProposal[];
  originalPlanPdfAssetId?: string; 
}

export interface SocialPostContent {
  text: string;
  mediaIds?: string[];
  storyText?: string;
}

export interface Comment {
  author: 'company' | 'partner';
  text: string;
  timestamp: string;
}

export type SocialPosts = Partial<Record<SocialPlatform, SocialPostContent>>;

export interface PartnerPostState {
  status: 'draft' | 'pending' | 'scheduled' | 'published' | 'completed' | 'processing' | 'error' | 'awaiting_approval' | 'changes_requested';
  posts: SocialPosts;
  comments?: Comment[];
}

export interface AssetMetadata {
  id: string;
  fileName: string;
  type: 'image' | 'video' | 'document';
  tags?: string[];
  aiTags?: string[]; 
  tagsStatus?: 'pending' | 'completed';
}

export interface CalendarEvent {
  id: string;
  date: string;
  assetId: string;
  assetName: string;
  time: string;
  campaignId?: string;
  postsByPartner: Record<string, PartnerPostState>;
}

export interface AppCalendarEvent extends CalendarEvent {
  assetDataUrl?: string;
  assetType?: 'image' | 'video' | 'document';
}

export interface BrandKit {
  logoAssetId?: string;
  primaryColor: string;
  secondaryColor: string;
  typography: string;
  brandStory: string;
}

export interface User {
  id: string;
  email: string;
  partnerAccess?: { companyId: string; partnerId: string }[];
}

export interface LeadActivity {
  id: string;
  type: LeadActivityType;
  description: string;
  timestamp: string;
}

export type LeadActivityType = 'form_submission' | 'email_open' | 'email_click' | 'page_revisit' | 'status_change';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  partnerId: string;
  status: LeadStatus;
  score: number;
  submittedAt: string;
  message?: string;
  activity?: LeadActivity[];
}

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  themeColor: string;
}

// Fix: Added ContentStrategyVersion for saving strategy versions
export interface ContentStrategyVersion {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  website: string;
  updatedAt?: string;
  language?: Language;
  description?: string;
  industry?: string;
  targetAudience?: string;
  valueProposition?: string;
  goals?: string;
  brandVoice?: BrandVoice;
  members?: { userId: string; role: TeamMemberRole; email: string; name?: string }[];
  partners: Partner[];
  contentStrategy?: string;
  isContentStrategyLocked?: boolean;
  savedContentStrategies?: ContentStrategyVersion[]; // Fix: Added savedContentStrategies
  contentPillars?: string[];
  socials?: Partial<Record<SocialPlatform, string>>;
  connections?: Connection[];
  mediaLibrary?: AssetMetadata[];
  events?: CalendarEvent[];
  brandKit?: BrandKit;
  growthPlan?: ProspectProposal;
  savedGrowthPlans?: ProspectProposal[];
  leads?: Lead[];
  campaigns?: Campaign[];
  analyticsSummary?: AnalyticsSummary;
  financialReportAssetId?: string;
  masterPlanPdfAssetId?: string; 
  interactiveTools?: InteractiveTool[];
  roadmapProgress?: string[]; 
  isLocked?: boolean;
  isSealed?: boolean;
  sealKey?: string;
  needsAnalysisSync?: boolean; 
  needsStrategySync?: boolean; 
  needsPlanSync?: boolean;     
  lastDnaChange?: string;      
  ideas?: PartnerIdea[];
  dripCampaigns?: DripCampaign[];
  activeDripCampaigns?: ActiveDripCampaign[];
  savedLandingPages?: SavedLandingPage[];
}

export interface InteractiveTool {
  id: string;
  name: string;
}

export type PortalTab = 'calendar' | 'idea_box' | 'leads' | 'initiatives' | 'success_stories' | 'guidelines';

export type SortKey = keyof Partner;
export type SortDirection = 'asc' | 'desc';

export interface EnrichmentStatus {
  total: number;
  completed: number;
  startTime: number;
}

export interface UploadedAsset {
  asset: AssetMetadata;
  file: File;
  previewUrl: string;
}

export interface UploadState {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export type PhotoStudioStyle = 'cinematic' | 'product' | 'food' | 'landscape' | 'portrait';

export interface TrendingTopicSuggestion {
  partnerId: string;
  partnerName: string;
  partnerLogoUrl?: string;
  topic: string;
  reason: string;
}

export interface PostAnalytics {
  eventId: string;
  platform: SocialPlatform;
  analytics: {
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    engagementRate: number;
  };
}

export interface ReportData {
  partner: Partner;
  companyName: string;
  analyticsData: PostAnalytics[];
  summary: string;
  kpis: { totalReach: number; engagementRate: number; totalClicks: number; };
}

export type GrowthTab = 'industry' | 'brand' | 'strategy' | 'photostudio' | 'success' | 'roadmap';