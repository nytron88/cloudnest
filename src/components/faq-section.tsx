"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    title?: string;
    subtitle?: string;
    faqs: FAQItem[];
}

export function FAQSection({
    title = "Frequently Asked Questions",
    subtitle,
    faqs
}: FAQSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                {subtitle && (
                    <p className="text-muted-foreground text-sm">{subtitle}</p>
                )}
            </div>

            <div className="max-w-2xl mx-auto">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="border-b border-border last:border-b-0"
                    >
                        <button
                            className="w-full flex items-center justify-between py-4 text-left hover:bg-muted/5 transition-colors duration-200 cursor-pointer"
                            onClick={() => toggleFAQ(index)}
                        >
                            <span className="font-medium text-base pr-4">{faq.question}</span>
                            {openIndex === index ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-32 pb-4' : 'max-h-0'
                            }`}>
                            <div className="text-base text-muted-foreground leading-relaxed">
                                {faq.answer}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 