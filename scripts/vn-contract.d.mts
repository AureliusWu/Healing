export const CONTRACT_VERSION: string;
export function validateGraph(data: {scenes?: unknown[]; nodes?: unknown[]; entry?: string}, options?: {requireLineIds?: boolean; targets?: (node: any) => string[]}): {contract:string;scenes:number;lines:number;choices:number;endings:number};
