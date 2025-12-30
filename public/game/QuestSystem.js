// Quest System

export class QuestSystem {
    constructor() {
        this.quests = {};
        this.completedQuests = [];

        this.initializeQuests();
    }

    initializeQuests() {
        this.quests = {
            'prove_seeds': {
                id: 'prove_seeds',
                name: 'Prove Your Seeds Work',
                description: 'Plant your seeds in Hobbs\' trial row and wait for harvest',
                objectives: [
                    { id: 'create_seed', text: 'Create a drought-resistant seed variety', complete: false },
                    { id: 'plant_trial', text: 'Plant seeds in trial row', complete: false },
                    { id: 'wait_harvest', text: 'Wait for harvest', complete: false },
                    { id: 'talk_hobbs', text: 'Talk to Hobbs about results', complete: false }
                ],
                status: 'inactive',
                rewards: {
                    gold: 50,
                    reputation: 10
                }
            },
            'meet_mira': {
                id: 'meet_mira',
                name: 'Meet Farmer Mira',
                description: 'Mira has heard about your seeds. Visit her farm.',
                objectives: [
                    { id: 'visit_mira', text: 'Visit Mira\'s farm', complete: false },
                    { id: 'talk_mira', text: 'Discuss her needs', complete: false }
                ],
                status: 'inactive',
                rewards: {
                    gold: 0,
                    reputation: 5
                }
            },
            'oldgrowth_offer': {
                id: 'oldgrowth_offer',
                name: 'OldGrowth\'s Offer',
                description: 'An OldGrowth representative has made you an offer.',
                objectives: [
                    { id: 'consider_offer', text: 'Consider the offer', complete: false },
                    { id: 'make_decision', text: 'Make your decision', complete: false }
                ],
                status: 'inactive',
                rewards: {
                    gold: 0
                }
            }
        };
    }

    startQuest(questId) {
        const quest = this.quests[questId];
        if (quest && quest.status === 'inactive') {
            quest.status = 'active';
            return true;
        }
        return false;
    }

    completeObjective(questId, objectiveId) {
        const quest = this.quests[questId];
        if (quest) {
            const objective = quest.objectives.find(o => o.id === objectiveId);
            if (objective) {
                objective.complete = true;

                // Check if all objectives complete
                if (quest.objectives.every(o => o.complete)) {
                    this.completeQuest(questId);
                }
                return true;
            }
        }
        return false;
    }

    completeQuest(questId) {
        const quest = this.quests[questId];
        if (quest) {
            quest.status = 'completed';
            this.completedQuests.push(questId);
            return quest.rewards;
        }
        return null;
    }

    isQuestStarted(questId) {
        const quest = this.quests[questId];
        return quest && quest.status !== 'inactive';
    }

    isQuestActive(questId) {
        const quest = this.quests[questId];
        return quest && quest.status === 'active';
    }

    isQuestCompleted(questId) {
        return this.completedQuests.includes(questId);
    }

    getActiveQuests() {
        return Object.values(this.quests).filter(q => q.status === 'active');
    }

    getQuest(questId) {
        return this.quests[questId];
    }

    serialize() {
        return {
            quests: this.quests,
            completedQuests: this.completedQuests
        };
    }

    deserialize(data) {
        this.quests = data.quests;
        this.completedQuests = data.completedQuests;
    }
}
