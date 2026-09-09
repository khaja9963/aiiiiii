import React from 'react';
import { BrainCircuit, ClipboardList, MessageSquareText, Sparkles } from 'lucide-react';
import { InterviewKit } from '../../types';
import { Button } from './Button';

interface InterviewQuestionsPanelProps {
  candidateName?: string;
  kit?: InterviewKit | null;
  isGenerating?: boolean;
  generationRequested?: boolean;
  onGenerate?: () => void;
}

export function InterviewQuestionsPanel({
  candidateName,
  kit,
  isGenerating = false,
  generationRequested = false,
  onGenerate,
}: InterviewQuestionsPanelProps) {
  if (!candidateName) {
    return (
      <aside className="h-full min-h-[360px] rounded-2xl border border-white/10 bg-[rgba(17,10,27,0.75)] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mb-4">
          <MessageSquareText className="w-6 h-6 text-[#c084fc]" />
        </div>
        <h2 className="text-base font-bold text-white">Interview workspace</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xs">Select a candidate to prepare backend-generated questions and answers.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-white/10 bg-[rgba(17,10,27,0.75)] overflow-hidden">
      <div className="p-5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#c084fc] font-bold">Interview workspace</p>
            <h2 className="text-lg font-bold text-white mt-1">{candidateName}</h2>
          </div>
          <BrainCircuit className="w-5 h-5 text-[#c084fc] shrink-0" />
        </div>
        {kit && (
          <p className="text-xs text-gray-400 mt-2">{kit.questions.length} questions ready from the interview service.</p>
        )}
      </div>

      <div className="p-5">
        {kit && kit.questions.length > 0 ? (
          <div className="space-y-4">
            {kit.questions.map((question, index) => (
              <article key={question.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#c084fc]">Question {index + 1}</span>
                  <span className="text-[10px] text-gray-500">{question.category}</span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-relaxed">{question.question}</h3>
                {question.answer && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-2">
                      <ClipboardList className="w-3.5 h-3.5" /> Model answer
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{question.answer}</p>
                  </div>
                )}
                {question.rationale && <p className="text-xs text-gray-500 mt-3">{question.rationale}</p>}
                {question.followUpProbe && <p className="text-xs text-[#c084fc] mt-3">Follow-up: {question.followUpProbe}</p>}
              </article>
            ))}
          </div>
        ) : generationRequested ? (
          <div className="py-12 text-center">
            <Sparkles className="w-7 h-7 text-[#c084fc] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">Ready for question generation</h3>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">The backend response will populate this panel with questions and model answers.</p>
            {onGenerate && (
              <Button className="mt-5" size="sm" isLoading={isGenerating} onClick={onGenerate}>
                Generate Questions
              </Button>
            )}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-300">No interview kit generated yet.</p>
            {onGenerate && (
              <Button className="mt-4" size="sm" leftIcon={<Sparkles className="w-4 h-4" />} onClick={onGenerate}>
                Generate Questions
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
