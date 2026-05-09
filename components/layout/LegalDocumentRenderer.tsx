import React from 'react';
import LegalPageLayout from './LegalPageLayout';
import { useTranslation } from '../../hooks/useTranslation';
import type { LegalPageCopy, CancellazioneBlock } from '../../utils/siteCopy';

/**
 * Renders a LegalPageCopy (privacy / cookie / rental / terms) inside the
 * shared LegalPageLayout. Inline markdown subset:
 *   **bold**         → <strong>bold</strong>
 *   [label](url)     → <a href="url">label</a> (target=_blank for http(s))
 * Anything else is plain text.
 */

const Inline: React.FC<{ text: string }> = ({ text }) => {
    return <>{parseInline(text)}</>;
};

function parseInline(text: string): React.ReactNode[] {
    if (!text) return [];
    const out: React.ReactNode[] = [];
    // Combined regex: bold OR link.
    const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex) {
            out.push(text.slice(lastIndex, match.index));
        }
        if (match[1]) {
            out.push(<strong key={key++}>{match[2]}</strong>);
        } else if (match[3]) {
            const label = match[4];
            const href = match[5];
            const isExternal = /^https?:\/\//i.test(href);
            out.push(
                <a
                    key={key++}
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                >
                    {label}
                </a>
            );
        }
        lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) {
        out.push(text.slice(lastIndex));
    }
    return out;
}

const Block: React.FC<{ block: CancellazioneBlock; lang: 'it' | 'en' }> = ({ block, lang }) => {
    const t = (it: string, en: string) => (lang === 'it' ? it : en);
    switch (block.type) {
        case 'p':
            return <p className="whitespace-pre-line"><Inline text={t(block.text_it, block.text_en)} /></p>;
        case 'p-bold':
            return <p className="font-semibold whitespace-pre-line"><Inline text={t(block.text_it, block.text_en)} /></p>;
        case 'p-italic':
            return <p className="italic text-sm text-gray-500 whitespace-pre-line"><Inline text={t(block.text_it, block.text_en)} /></p>;
        case 'ul': {
            const items = lang === 'it' ? block.items_it : block.items_en;
            return (
                <ul>
                    {items.map((item, i) => (
                        <li key={i}><Inline text={item} /></li>
                    ))}
                </ul>
            );
        }
        default:
            return null;
    }
};

interface Props {
    copy: LegalPageCopy;
}

const LegalDocumentRenderer: React.FC<Props> = ({ copy }) => {
    const { lang } = useTranslation();
    const title = lang === 'it' ? copy.title_it : copy.title_en;
    const updatedLabel = lang === 'it' ? copy.last_updated_label_it : copy.last_updated_label_en;
    const today = new Date().toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB');

    return (
        <LegalPageLayout title={title}>
            {copy.last_updated_dynamic && updatedLabel && (
                <p><strong>{updatedLabel}: {today}</strong></p>
            )}

            {copy.intro_blocks.map((b, i) => (
                <Block key={`intro-${i}`} block={b} lang={lang} />
            ))}

            {copy.sections.map((s) => (
                <React.Fragment key={s.id}>
                    <h2>{lang === 'it' ? s.heading_it : s.heading_en}</h2>
                    {s.blocks.map((b, i) => (
                        <Block key={`${s.id}-${i}`} block={b} lang={lang} />
                    ))}
                </React.Fragment>
            ))}

            {copy.outro_blocks.length > 0 && (
                <div className="mt-8">
                    {copy.outro_blocks.map((b, i) => (
                        <Block key={`outro-${i}`} block={b} lang={lang} />
                    ))}
                </div>
            )}
        </LegalPageLayout>
    );
};

export default LegalDocumentRenderer;
