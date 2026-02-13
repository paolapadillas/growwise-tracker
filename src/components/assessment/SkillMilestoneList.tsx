import { Check, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import kineduLogo from "@/assets/logo-kinedu-blue.png";

interface Milestone {
  milestone_id: number;
  age: number;
  question: string;
  description: string;
  skill_id: number;
  skill_name: string;
  area_id: number;
  area_name: string;
}

interface SkillMilestoneListProps {
  areaName: string;
  areaIcon: string;
  skillName: string;
  skillNumber: number;
  totalSkills: number;
  milestones: Milestone[];
  responses: { [key: number]: string };
  areaColor: string;
  onResponse: (milestoneId: number, answer: "yes" | "no") => void;
  onNextSkill: () => void;
  onGoToLastSkill?: () => void;
  isLastSkill: boolean;
  babyName?: string;
  babyAgeMonths?: number;
  overallProgress?: number;
}

export const SkillMilestoneList = ({
  areaName,
  areaIcon,
  skillName,
  skillNumber,
  totalSkills,
  milestones,
  responses,
  areaColor,
  onResponse,
  onNextSkill,
  onGoToLastSkill,
  isLastSkill,
  babyName,
  babyAgeMonths,
  overallProgress,
}: SkillMilestoneListProps) => {
  const displayName = babyName || 'baby';
  const answeredCount = milestones.filter(m => responses[m.milestone_id]).length;
  const allAnswered = answeredCount === milestones.length;

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-3 pb-2">
        {/* Progress bar */}
        {overallProgress !== undefined && (
          <div className="max-w-2xl mx-auto mb-2">
            <div className="flex justify-center mb-1.5">
              <img src={kineduLogo} alt="Kinedu" className="h-5" />
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">Your report</span>
              <span className="text-[10px] font-bold text-primary">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-1.5 bg-muted/40" />
          </div>
        )}

        {/* Skill header - one compact line */}
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {skillNumber > 1 && onGoToLastSkill && (
              <button onClick={onGoToLastSkill} className="flex-shrink-0 p-1 -ml-1 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <img src={areaIcon} alt={areaName} className="w-5 h-5 object-contain flex-shrink-0" />
            <span className="text-sm font-semibold truncate" style={{ color: areaColor }}>
              {areaName} · {skillName}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
            {skillNumber}/{totalSkills}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 pt-3 pb-4">
        {/* Question prompt */}
        <p className="text-sm font-semibold text-foreground mb-3">
          Does {displayName} do these?
        </p>

        {/* Milestones List - compact */}
        <div className="space-y-2 mb-5">
          {milestones.map((milestone) => {
            const answer = responses[milestone.milestone_id];
            const isYes = answer === "yes";
            const isNo = answer === "no";
            const isAnswered = isYes || isNo;

            return (
              <div 
                key={milestone.milestone_id} 
                className={`rounded-xl border transition-all duration-150 ${
                  isYes ? 'border-green-300 bg-green-50/50' : 
                  isNo ? 'border-muted bg-muted/20' : 
                  'border-border bg-background shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <p className={`flex-1 text-[13px] leading-snug ${
                    isNo ? 'text-muted-foreground' : 'text-foreground'
                  }`}>
                    {milestone.description || milestone.question}
                  </p>
                  
                  {/* Yes / No buttons */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onResponse(milestone.milestone_id, "yes")}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
                        isYes 
                          ? 'bg-green-500 text-white shadow-sm' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-green-100 hover:text-green-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => onResponse(milestone.milestone_id, "no")}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
                        isNo 
                          ? 'bg-muted text-muted-foreground shadow-sm' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-red-50 hover:text-red-400'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Skill Button */}
        <Button
          onClick={onNextSkill}
          className="w-full py-5 text-base font-semibold rounded-xl shadow-lg"
          style={{ backgroundColor: areaColor }}
        >
          {isLastSkill ? `See ${areaName} results` : "Next Skill →"}
        </Button>

        {/* Answered counter */}
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          {answeredCount} of {milestones.length} answered
        </p>
      </div>
    </div>
  );
};
