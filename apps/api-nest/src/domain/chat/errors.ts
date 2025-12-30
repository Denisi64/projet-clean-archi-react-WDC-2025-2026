export class ConversationNotFound extends Error {
    constructor() {
        super('ConversationNotFound');
    }
}

export class ForbiddenConversationAccess extends Error {
    constructor() {
        super('ForbiddenConversationAccess');
    }
}

export class ConversationClosed extends Error {
    constructor() {
        super('ConversationClosed');
    }
}

export class AlreadyAssigned extends Error {
    constructor() {
        super('ConversationAlreadyAssigned');
    }
}
