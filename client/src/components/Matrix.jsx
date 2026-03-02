import React from 'react';
import { Calendar, Info, TrendingUp, AlertCircle } from 'lucide-react';

const Matrix = ({ data, attributions }) => {
  if (!data?.universities) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const timelineRows = [
    { key: 'year1', label: 'Year 1 (Freshman)', type: 'base' },
    { key: 'year2', label: 'Year 2', type: 'projection' },
    { key: 'year3', label: 'Year 3', type: 'projection' },
    { key: 'year4', label: 'Year 4', type: 'projection' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl border-cyan-500/20 shadow-xl shadow-cyan-900/10">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{data.normalizedCourseName}</h2>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-500" />
            Comparison based on 2024-2025 Semester Equivalents
          </p>
        </div>
        <div className="flex -space-x-2">
          {data.universities.map((uni, idx) => (
            <div key={idx} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-300 ring-2 ring-cyan-500/20" title={uni.name}>
              {uni.abbreviation}
            </div>
          ))}
        </div>
      </div>

      {/* Main Matrix Container */}
      <div id="matrix-container" className="overflow-x-auto rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/30 backdrop-blur-md">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="sticky left-0 z-20 bg-slate-900 px-6 py-6 text-slate-400 font-semibold uppercase tracking-wider text-xs border-r border-slate-800/50 min-w-[200px]">
                Timeline
              </th>
              {data.universities.map((uni, idx) => (
                <th key={idx} className="px-6 py-6 font-bold text-slate-100 min-w-[180px]">
                  <div className="text-lg leading-tight mb-1">{uni.abbreviation}</div>
                  <div className="text-[10px] font-normal text-slate-500 uppercase tracking-widest">{uni.name.replace('University of the Philippines Diliman', 'UP Diliman')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Year 1 Details Expansion */}
            <tr className="bg-slate-800/20">
              <td className="sticky left-0 z-10 bg-slate-900/95 p-6 border-r border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="font-bold text-slate-200">Year 1 Breakdown</span>
                </div>
              </td>
              {data.universities.map((uni, idx) => (
                <td key={idx} className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                      <span className="text-[10px] text-slate-500 uppercase font-medium">Tuition</span>
                      <span className={`font-mono font-medium ${uni.year1.tuitionFee === 0 ? 'text-green-400' : 'text-slate-300'}`}>
                        {uni.year1.tuitionFee === 0 ? 'FREE' : formatCurrency(uni.year1.tuitionFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                        <span className="text-[10px] text-slate-500 uppercase font-medium">Misc. Fees</span>
                        <span className="font-mono text-slate-300 font-medium">{formatCurrency(uni.year1.miscFees)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Sem</span>
                        <span className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                          {formatCurrency(uni.year1.total)}
                        </span>
                    </div>
                    {uni.year1.isTrimestral && (
                      <div className="text-[9px] bg-indigo-500/10 text-indigo-400 py-1 px-2 rounded-md font-medium border border-indigo-500/20 inline-block">
                        Converted from Trimester
                      </div>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Projections */}
            {[2, 3, 4].map((year) => (
              <tr key={year} className="border-t border-slate-800/50 hover:bg-white/5 transition-colors">
                <td className="sticky left-0 z-10 bg-slate-900/95 p-6 border-r border-slate-800/50">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="font-bold text-slate-300 tracking-tight">Year {year} Projection</span>
                   </div>
                </td>
                {data.universities.map((uni, idx) => {
                  const projection = uni.projection.find(p => p.year === year);
                  return (
                    <td key={idx} className="p-6">
                      <div className="text-lg font-bold text-slate-200 opacity-80 font-mono">
                        {formatCurrency(projection.estimatedTotal)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase font-medium tabular-nums">+6% Forecast</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grounding & Attribution */}
      <div className="glass p-8 rounded-3xl border-slate-800/50 space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <AlertCircle className="w-4 h-4 text-amber-500" />
           Data Transparency & Grounding
        </h3>
        <div className="text-xs text-slate-400 leading-relaxed max-w-4xl space-y-2">
            <p className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 font-mono italic">
              "Smart Grounding" enabled. Real-time cost data fetched via Google Search for AY 2024-2025. 
              Inflation rate of 6% is applied annually to base miscellaneous and tuition components.
            </p>
            {attributions && (
              <div 
                className="prose prose-invert prose-xs max-w-none opacity-60 mt-4 overflow-hidden" 
                dangerouslySetInnerHTML={{ __html: attributions }}
              />
            )}
            {!attributions && data.groundingSources && (
               <p className="mt-4 text-[10px] text-slate-500 line-clamp-2">Sources: {data.groundingSources}</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Matrix;
