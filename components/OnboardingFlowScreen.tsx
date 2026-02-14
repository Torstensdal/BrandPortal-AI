import React from 'react';
import { CompanyDetailsScreen } from './CompanyDetailsScreen';
import { ProspectProposalDisplay } from './ProspectProposalDisplay';

export const OnboardingFlowScreen = (props: any) => {
    if (props.activeStep === 'onboarding_company_info') return <CompanyDetailsScreen {...props} />;
    if (props.activeStep === 'onboarding_plan') return <ProspectProposalDisplay proposal={props.company.growthPlan} isInternalPlan={true} {...props} />;
    return <div className="p-20 text-center">Step: {props.activeStep} - Kommer snart</div>;
};