import { mathNodes } from './math';
import { vectorNodes } from './vectors';
import { dataNodes } from './data';
import { effectNodes } from './effects';
import { NodeDef } from './utils';

// Combine all nodes
export const coreNodes: NodeDef[] = [
    ...dataNodes,
    ...mathNodes,
    ...vectorNodes,
    ...effectNodes
];

export * from './utils';
