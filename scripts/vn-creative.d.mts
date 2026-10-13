export const CREATIVE_VERSION: string;
export function snapshotStory(story: unknown): any;
export function auditRevision(baseline: unknown, story: unknown): {creativeVersion:string;scenes:number;revisedParagraphs:number;protectedVoices:number;savePositionsPreserved:boolean;routeContractPreserved:boolean;changes:Array<{scene:string;section:string;index:number;id:string}>};
export function validateFrames(catalog: unknown): number;
