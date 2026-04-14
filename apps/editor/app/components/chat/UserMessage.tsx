/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';
import { Markdown } from './Markdown';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import type {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
  SourceUIPart,
  FileUIPart,
  StepStartUIPart,
} from '@ai-sdk/ui-utils';

interface UserMessageProps {
  content: string | Array<{ type: string; text?: string; image?: string }>;
  parts:
    | (TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart)[]
    | undefined;
}

export function UserMessage({ content, parts }: UserMessageProps) {
  const profile = useStore(profileStore);

  const images =
    parts?.filter(
      (part): part is FileUIPart => part.type === 'file' && 'mimeType' in part && part.mimeType.startsWith('image/'),
    ) || [];

  const bubbleStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.18) 100%)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '14px 14px 3px 14px',
    color: 'rgba(255,255,255,0.92)',
    fontSize: '0.875rem',
    lineHeight: '1.65',
    backdropFilter: 'blur(8px)',
  };

  if (Array.isArray(content)) {
    const textItem = content.find((item) => item.type === 'text');
    const textContent = stripMetadata(textItem?.text || '');

    return (
      <div className="mc-message-appear flex flex-col gap-3 items-end">
        {/* Avatar row */}
        <div className="flex flex-row items-center justify-end gap-2">
          {profile?.username && (
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {profile.username}
            </span>
          )}
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile?.username || 'User'}
              className="w-6 h-6 object-cover rounded-full"
              style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' }}
              loading="eager"
              decoding="sync"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        {/* Bubble */}
        <div className="flex flex-col gap-3 max-w-[85%]" style={bubbleStyle}>
          <div className="px-4 py-3">
            {textContent && <Markdown html>{textContent}</Markdown>}
            {images.map((item, index) => (
              <img
                key={index}
                src={`data:${item.mimeType};base64,${item.data}`}
                alt={`Image ${index + 1}`}
                className="max-w-full h-auto rounded-lg mt-2"
                style={{ maxHeight: '512px', objectFit: 'contain' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const textContent = stripMetadata(content);

  return (
    <div className="mc-message-appear flex flex-col items-end gap-2">
      {/* Avatar row */}
      <div className="flex flex-row items-center gap-2">
        {profile?.username && (
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {profile.username}
          </span>
        )}
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt={profile?.username || 'User'}
            className="w-6 h-6 object-cover rounded-full"
            style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' }}
            loading="eager"
            decoding="sync"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
      {/* Bubble */}
      <div className="max-w-[85%]" style={bubbleStyle}>
        {images.length > 0 && (
          <div className="flex gap-3 flex-wrap px-4 pt-3">
            {images.map((item, index) => (
              <div
                key={index}
                className="relative flex rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="h-16 w-16 bg-transparent">
                  <img
                    src={`data:${item.mimeType};base64,${item.data}`}
                    alt={`Image ${index + 1}`}
                    className="h-full w-full rounded-lg"
                    style={{ objectFit: 'fill' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-3">
          <Markdown html>{textContent}</Markdown>
        </div>
      </div>
    </div>
  );
}

function stripMetadata(content: string) {
  const artifactRegex = /<boltArtifact\s+[^>]*>[\s\S]*?<\/boltArtifact>/gm;
  return content.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '').replace(artifactRegex, '');
}
