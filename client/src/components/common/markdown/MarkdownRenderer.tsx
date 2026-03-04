import React from 'react';
import ReactMarkdown from 'react-markdown';
import Admonition from '../../utils/Admonition';
import { flattenToText } from '../../../utils/markdownUtils';
import MermaidViewer from './MermaidViewer';

export interface MarkdownRendererProps {
    children: string;
    className?: string;
    disableMermaid?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className, disableMermaid }) => {
    return (
        <ReactMarkdown
            className={className}
            components={{
                blockquote: ({ children }) => {
                    const text = flattenToText(children).trim();
                    const match = text.match(
                        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/
                    );
                    if (match) {
                        return (
                            <Admonition type={match[1] as any}>{match[2].trim()}</Admonition>
                        );
                    }
                    return <blockquote>{children}</blockquote>;
                },
                p: ({ children }) => {
                    const text = flattenToText(children).trim();
                    const match = text.match(
                        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/
                    );
                    if (match) {
                        return (
                            <Admonition type={match[1] as any}>{match[2].trim()}</Admonition>
                        );
                    }
                    return <p>{children}</p>;
                },
                pre: ({ node, children, ...props }: any) => {
                    if (disableMermaid) {
                        return <pre {...props}>{children}</pre>;
                    }
                    const childArray = React.Children.toArray(children);
                    if (
                        childArray.length === 1 &&
                        React.isValidElement(childArray[0]) &&
                        typeof childArray[0].props.className === 'string' &&
                        childArray[0].props.className.includes('language-mermaid')
                    ) {
                        return <>{children}</>;
                    }
                    return <pre {...props}>{children}</pre>;
                },
                code: ({ node, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isMermaid = !disableMermaid && match && match[1] === 'mermaid';

                    if (isMermaid) {
                        return <MermaidViewer code={String(children).replace(/\n$/, '')} />;
                    }

                    return (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                }
            }}
        >
            {children}
        </ReactMarkdown>
    );
};


export default MarkdownRenderer;
