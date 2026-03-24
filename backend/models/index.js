/**
 * Models Index
 * Export all database models
 */

const { sequelize } = require('../config/database');
const User = require('./User');
const Member = require('./Member');
const Loan = require('./Loan');
const Contribution = require('./Contribution');
const Payment = require('./Payment');
const Notice = require('./Notice');
const Event = require('./Event');
const News = require('./News');
const Bereavement = require('./Bereavement');
const Debt = require('./Debt');
const Fine = require('./Fine');
const Savings = require('./Savings');
const Announcement = require('./Announcement');
const Document = require('./Document');
const Report = require('./Report');
const Volunteer = require('./Volunteer');
const Faq = require('./Faq');
const Policy = require('./Policy');
const Gallery = require('./Gallery');
const Contact = require('./Contact');
const Newsletter = require('./Newsletter');
const Withdrawal = require('./Withdrawal');

// Define associations
// User - Member association (User has memberId pointing to Member)
User.hasOne(Member, { foreignKey: 'userId', as: 'member' });
Member.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Member - Loan associations
Member.hasMany(Loan, { foreignKey: 'memberId', as: 'loans' });
Loan.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Contribution associations
Member.hasMany(Contribution, { foreignKey: 'memberId', as: 'contributions' });
Contribution.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Payment associations
Member.hasMany(Payment, { foreignKey: 'memberId', as: 'payments' });
Payment.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Savings associations
Member.hasMany(Savings, { foreignKey: 'memberId', as: 'savings' });
Savings.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Fine associations
Member.hasMany(Fine, { foreignKey: 'memberId', as: 'fines' });
Fine.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Debt associations
Member.hasMany(Debt, { foreignKey: 'memberId', as: 'debts' });
Debt.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Bereavement associations
Member.hasMany(Bereavement, { foreignKey: 'memberId', as: 'bereavements' });
Bereavement.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Volunteer associations
Member.hasMany(Volunteer, { foreignKey: 'memberId', as: 'volunteerings' });
Volunteer.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member - Withdrawal associations
Member.hasMany(Withdrawal, { foreignKey: 'memberId', as: 'withdrawals' });
Withdrawal.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// User - Contribution associations (recordedBy)
Contribution.belongsTo(User, { foreignKey: 'recordedBy', as: 'recordedBy' });

// User - Loan associations (approvedBy, rejectedBy)
Loan.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
Loan.belongsTo(User, { foreignKey: 'rejectedBy', as: 'rejector' });

// User - Fine associations (issuedBy)
Fine.belongsTo(User, { foreignKey: 'issuedBy', as: 'issuer' });

// User - Notice associations
Notice.belongsTo(User, { foreignKey: 'author', as: 'authorUser' });

// User - News associations
News.belongsTo(User, { foreignKey: 'author', as: 'authorUser' });

// User - Announcement associations
Announcement.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });

// User - Document associations
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// User - Volunteer associations (reviewedBy)
Volunteer.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// User - Withdrawal associations (processedBy)
Withdrawal.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' });
Withdrawal.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

// Event - Gallery associations
Event.hasMany(Gallery, { foreignKey: 'eventId', as: 'galleries' });
Gallery.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

/**
 * Initialize all models with sequelize instance
 * @param {Sequelize} sequelize - Sequelize instance
 */
async function initModels(sequelizeInstance) {
    // Re-initialize with the provided sequelize instance if different
    if (sequelizeInstance && sequelizeInstance !== sequelize) {
        // All models are already defined with the global sequelize instance
        // This function can be used to ensure associations are set up
        console.log('Models already initialized with default sequelize instance');
    }
    
    return {
        sequelize,
        User,
        Member,
        Loan,
        Contribution,
        Payment,
        Notice,
        Event,
        News,
        Bereavement,
        Debt,
        Fine,
        Savings,
        Announcement,
        Document,
        Report,
        Volunteer,
        Faq,
        Policy,
        Gallery,
        Contact,
        Newsletter,
        Withdrawal
    };
}

module.exports = {
    sequelize,
    initModels,
    User,
    Member,
    Loan,
    Contribution,
    Payment,
    Notice,
    Event,
    News,
    Bereavement,
    Debt,
    Fine,
    Savings,
    Announcement,
    Document,
    Report,
    Volunteer,
    Faq,
    Policy,
    Gallery,
    Contact,
    Newsletter,
    Withdrawal
};
