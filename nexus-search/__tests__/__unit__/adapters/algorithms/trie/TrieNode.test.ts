import { TrieNode } from "@/index";

describe('TrieNode', () => {
    let node: TrieNode;

    beforeEach(() => {
        node = new TrieNode(0);
    });

    describe('Constructor', () => {
        it('should initialize with correct default values', () => {
            expect(node.children).toBeInstanceOf(Map);
            expect(node.children.size).toBe(0);
            expect(node.isEndOfWord).toBeFalsy();
            expect(node.documentRefs).toBeInstanceOf(Set);
            expect(node.weight).toBe(0);
            expect(node.frequency).toBe(0);
            expect(node.prefixCount).toBe(0);
            expect(node.depth).toBe(0);
        });

        it('should initialize with specified depth', () => {
            const deepNode = new TrieNode(5);
            expect(deepNode.depth).toBe(5);
        });
    });

    describe('Child Management', () => {
        it('should add child correctly', () => {
            const child = node.addChild('a');
            expect(child).toBeInstanceOf(TrieNode);
            expect(child.depth).toBe(1);
            expect(node.children.get('a')).toBe(child);
        });

        it('should get child correctly', () => {
            const child = node.addChild('b');
            expect(node.getChild('b')).toBe(child);
            expect(node.getChild('c')).toBeUndefined();
        });

        it('should check child existence correctly', () => {
            node.addChild('d');
            expect(node.hasChild('d')).toBeTruthy();
            expect(node.hasChild('e')).toBeFalsy();
        });

        it('should clear children correctly', () => {
            node.addChild('a');
            node.addChild('b');
            node.documentRefs.add('doc1');
            node.weight = 1.0;
            node.frequency = 1;

            node.clearChildren();

            expect(node.children.size).toBe(0);
            expect(node.documentRefs.size).toBe(0);
            expect(node.weight).toBe(0);
            expect(node.frequency).toBe(0);
        });
    });

    describe('Weight Management', () => {
        it('should increment weight correctly', () => {
            node.incrementWeight();
            expect(node.weight).toBe(1.0);
            expect(node.frequency).toBe(1);
            
            node.incrementWeight(2.0);
            expect(node.weight).toBe(3.0);
            expect(node.frequency).toBe(2);
        });

        it('should decrement weight correctly', () => {
            node.incrementWeight(5.0);
            node.decrementWeight(2.0);
            expect(node.weight).toBe(3.0);
            expect(node.frequency).toBe(0);

            // Should not go below 0
            node.decrementWeight(5.0);
            expect(node.weight).toBe(0);
            expect(node.frequency).toBe(0);
        });
    });

    describe('Node Status', () => {
        it('should determine when node should be pruned', () => {
            expect(node.shouldPrune()).toBeTruthy();

            node.documentRefs.add('doc1');
            expect(node.shouldPrune()).toBeFalsy();

            node.documentRefs.clear();
            node.weight = 1.0;
            expect(node.shouldPrune()).toBeFalsy();

            node.weight = 0;
            node.addChild('a');
            expect(node.shouldPrune()).toBeFalsy();
        });
    });

    describe('Scoring', () => {
        it('should calculate score correctly', () => {
            node.incrementWeight(2.0);
            const score1 = node.getScore();
            
            // Wait a small amount to test recency impact
            jest.advanceTimersByTime(1000);
            const score2 = node.getScore();
            
            expect(score1).toBeGreaterThan(0);
            expect(score1).toBeGreaterThan(score2); // Score should decay over time
        });

        it('should consider depth in scoring', () => {
            const node1 = new TrieNode(0);
            const node2 = new TrieNode(2);

            node1.incrementWeight(1.0);
            node2.incrementWeight(1.0);

            expect(node1.getScore()).toBeGreaterThan(node2.getScore());
        });
    });
});