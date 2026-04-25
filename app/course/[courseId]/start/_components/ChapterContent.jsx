import React, { useState } from 'react'
import YouTube from 'react-youtube'
import ReactMarkdown from 'react-markdown';
import { HiOutlineLightBulb, HiOutlineCheckCircle, HiOutlineQuestionMarkCircle } from "react-icons/hi2";

const opts = {
    height: '450',
    width: '100%',
    playerVars: {
      autoplay: 0,
    },
};

function ChapterContent({chapter,content}) {
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showFeedback, setShowFeedback] = useState({});

    const handleAnswer = (quizIndex, option) => {
        setSelectedAnswers(prev => ({...prev, [quizIndex]: option}));
        setShowFeedback(prev => ({...prev, [quizIndex]: true}));
    };

    // Support both old and new data structures
    const sections = content?.content?.content || content?.content || [];
    const interactive = content?.content?.interactive || null;

    return (
        <div className='p-6 md:p-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700'>
            <div className="mb-10">
                <h2 className='font-black text-4xl text-slate-900 tracking-tight'>{chapter?.name}</h2>
                <p className='text-slate-500 mt-3 text-lg leading-relaxed'>{chapter?.about}</p>
            </div>

            {!content && (
                <div className='rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900'>
                    <h3 className='text-xl font-black'>Chapter content is not generated yet</h3>
                    <p className='mt-2 text-sm font-medium'>
                        Generate course content from the course layout screen before starting this lesson.
                    </p>
                </div>
            )}
            
            {/* Video Section with Premium Frame */}
            {content?.videoId && (
                <div className='my-10 overflow-hidden rounded-3xl shadow-2xl border-8 border-white shadow-purple-100'>
                    <YouTube
                        videoId={content?.videoId}
                        opts={opts}
                    />
                </div>
            )}

            {/* Core Content Sections */}
            <div className='space-y-10'>
                {Array.isArray(sections) && sections.map((item, index) => (
                    <div key={index} className='glass p-8 rounded-3xl border border-white/50 shadow-premium transition-all hover:shadow-premium-hover'>
                        <h3 className='font-bold text-2xl text-slate-800 mb-4 flex items-center gap-3'>
                            <span className="flex items-center justify-center size-8 bg-primary/10 text-primary rounded-lg text-sm">{index + 1}</span>
                            {item.title}
                        </h3>
                        
                        <div className='prose prose-slate max-w-none'>
                            <ReactMarkdown className='text-lg text-slate-600 leading-relaxed font-medium'>
                                {item.explanation || item.description}
                            </ReactMarkdown>
                        </div>

                        {item.codeExample && (
                            <div className='relative mt-6 group'>
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                <div className='relative p-6 bg-slate-900 text-indigo-300 rounded-2xl font-mono text-sm overflow-x-auto border border-white/10'>
                                    <pre>
                                        <code>{item.codeExample.replace('<precode>','').replace('</precode>','')}</code>
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Interactive Section (Quizzes & Challenges) */}
            {interactive && (
                <div className="mt-16 space-y-12">
                    {/* Quiz Section */}
                    {interactive.quiz && interactive.quiz.length > 0 && (
                        <div className="bg-white p-10 rounded-3xl shadow-premium border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <HiOutlineQuestionMarkCircle className="text-3xl text-primary" />
                                <h3 className="text-2xl font-black text-slate-800">Check Your Knowledge</h3>
                            </div>
                            
                            <div className="space-y-8">
                                {interactive.quiz.map((q, idx) => (
                                    <div key={idx} className="space-y-4 p-6 bg-slate-50 rounded-2xl">
                                        <p className="font-bold text-slate-700 text-lg">Q: {q.question}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map((option, oIdx) => (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleAnswer(idx, option)}
                                                    className={`p-4 rounded-xl border-2 transition-all text-left font-medium ${
                                                        selectedAnswers[idx] === option 
                                                        ? (option === q.answer ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700')
                                                        : 'bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                        {showFeedback[idx] && (
                                            <div className={`mt-4 p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${
                                                selectedAnswers[idx] === q.answer ? 'text-green-600 bg-green-50/50' : 'text-red-600 bg-red-50/50'
                                            }`}>
                                                {selectedAnswers[idx] === q.answer ? (
                                                    <><HiOutlineCheckCircle /> Spot on! Great job.</>
                                                ) : (
                                                    `Incorrect. The right answer was: ${q.answer}`
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Challenge Section */}
                    {interactive.challenge && (
                        <div className="bg-gradient-to-br from-primary/5 to-indigo-50/50 p-10 rounded-3xl border border-primary/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <HiOutlineLightBulb className="text-8xl text-primary" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <HiOutlineLightBulb className="text-3xl text-primary" />
                                    <h3 className="text-2xl font-black text-slate-800">Pro Challenge</h3>
                                </div>
                                <p className="text-slate-600 text-lg leading-relaxed italic font-medium">
                                    "{interactive.challenge}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ChapterContent
