
import React from 'react';
import * as tsl from 'three/tsl';
import { NodeType } from '../../types';
import { BaseNode } from '../../components/BaseNode';

export interface NodeIO {
    inputs: string[];
    outputs: string[];
    initialValues?: Record<string, any>;
    initialValue?: any;
    meta?: any;
}

export type TSLGenerator = (inputs: Record<string, any>, data?: any) => any;
export type CodeGeneratorFn = (inputs: Record<string, string>, data?: any, id?: string, addImport?: (name: string) => void) => string;

export interface NodeDef {
    type: NodeType;
    label: string;
    category: string;
    icon?: any;
    component: React.ComponentType<any>;
    inputs: string[];
    outputs: string[];
    initialValues?: Record<string, any>;
    initialValue?: any;
    meta?: any;
    tslFn: TSLGenerator;
    codeFn: CodeGeneratorFn;
}

export const defineNode = (
    type: NodeType,
    label: string,
    category: string,
    icon: any,
    io: NodeIO,
    tslFn: TSLGenerator,
    codeFn: CodeGeneratorFn,
    component: React.ComponentType<any> = BaseNode
): NodeDef => {
    return {
        type,
        label,
        category,
        icon,
        component,
        ...io,
        tslFn,
        codeFn
    };
};

const safe = (v: any) => v || tsl.float(0);

// Helper for standard function calls like add(a, b)
export const standardOp = (
    op: any, 
    tslOpName: string, 
    inputs: string[]
): [TSLGenerator, CodeGeneratorFn] => {
    return [
        (inps) => op(...inputs.map(k => safe(inps[k]))),
        (inps, _, __, addImport) => {
            if(addImport) addImport(tslOpName);
            // safe check for code gen string too
            const args = inputs.map(k => inps[k] || 'float(0)').join(', ');
            return `${tslOpName}(${args})`;
        }
    ];
};

// Helper for method calls like a.add(b)
export const methodOp = (
    op: any, 
    methodName: string,
    primaryInput: string,
    args: string[],
    tslOpName?: string 
): { tslFn: TSLGenerator, codeFn: CodeGeneratorFn } => {
    return {
        tslFn: (inps) => {
            const main = safe(inps[primaryInput]);
            if (!main || !main[methodName]) return tsl.float(0); 
            return main[methodName](...args.map(k => safe(inps[k])));
        },
        codeFn: (inps, _, __, addImport) => {
            if(addImport && tslOpName) addImport(tslOpName);
            const main = inps[primaryInput] || 'float(0)';
            const argStr = args.map(k => inps[k] || 'float(0)').join(', ');
            return `${main}.${methodName}(${argStr})`;
        }
    };
};
