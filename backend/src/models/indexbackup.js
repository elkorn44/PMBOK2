// backend/src/models/index.js
// All Sequelize models for PMBOK database

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// =====================================================
// CORE MODELS
// =====================================================

// Projects Model
const Project = sequelize.define('Project', {
  project_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  project_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  start_date: {
    type: DataTypes.DATEONLY
  },
  end_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'),
    defaultValue: 'Planning'
  },
  project_manager: {
    type: DataTypes.STRING(100)
  },
  client_name: {
    type: DataTypes.STRING(255)
  },
  created_by: {
    type: DataTypes.STRING(100)
  }
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// People Model
const Person = sequelize.define('Person', {
  person_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255)
  },
  role: {
    type: DataTypes.STRING(100)
  },
  department: {
    type: DataTypes.STRING(100)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'people',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// =====================================================
// DOCUMENT MODELS
// =====================================================

// Issues Model
const Issue = sequelize.define('Issue', {
  issue_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  issue_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed', 'Cancelled'),
    defaultValue: 'Open'
  },
  category: {
    type: DataTypes.STRING(100)
  },
  raised_by: {
    type: DataTypes.INTEGER
  },
  assigned_to: {
    type: DataTypes.INTEGER
  },
  raised_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  target_resolution_date: {
    type: DataTypes.DATEONLY
  },
  actual_resolution_date: {
    type: DataTypes.DATEONLY
  },
  impact: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'issues',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Risks Model
const Risk = sequelize.define('Risk', {
  risk_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  risk_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  probability: {
    type: DataTypes.ENUM('Very Low', 'Low', 'Medium', 'High', 'Very High'),
    defaultValue: 'Medium'
  },
  impact: {
    type: DataTypes.ENUM('Very Low', 'Low', 'Medium', 'High', 'Very High'),
    defaultValue: 'Medium'
  },
  risk_score: {
    type: DataTypes.DECIMAL(5, 2)
  },
  status: {
    type: DataTypes.ENUM('Identified', 'Assessed', 'Mitigated', 'Closed', 'Occurred'),
    defaultValue: 'Identified'
  },
  category: {
    type: DataTypes.STRING(100)
  },
  identified_by: {
    type: DataTypes.INTEGER
  },
  owner: {
    type: DataTypes.INTEGER
  },
  identified_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  review_date: {
    type: DataTypes.DATEONLY
  },
  mitigation_strategy: {
    type: DataTypes.TEXT
  },
  contingency_plan: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'risks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Changes Model
const Change = sequelize.define('Change', {
  change_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  change_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  change_type: {
    type: DataTypes.ENUM('Scope', 'Schedule', 'Cost', 'Quality', 'Resource', 'Other'),
    defaultValue: 'Other'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Requested', 'Under Review', 'Approved', 'Rejected', 'Implemented', 'Closed'),
    defaultValue: 'Requested'
  },
  requested_by: {
    type: DataTypes.INTEGER
  },
  approved_by: {
    type: DataTypes.INTEGER
  },
  request_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  approval_date: {
    type: DataTypes.DATEONLY
  },
  implementation_date: {
    type: DataTypes.DATEONLY
  },
  cost_impact: {
    type: DataTypes.DECIMAL(15, 2)
  },
  schedule_impact_days: {
    type: DataTypes.INTEGER
  },
  justification: {
    type: DataTypes.TEXT
  },
  impact_assessment: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'changes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Escalations Model
const Escalation = sequelize.define('Escalation', {
  escalation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  escalation_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Raised', 'Under Review', 'Resolved', 'Closed'),
    defaultValue: 'Raised'
  },
  escalation_type: {
    type: DataTypes.STRING(100)
  },
  raised_by: {
    type: DataTypes.INTEGER
  },
  escalated_to: {
    type: DataTypes.INTEGER
  },
  raised_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  target_response_date: {
    type: DataTypes.DATEONLY
  },
  actual_response_date: {
    type: DataTypes.DATEONLY
  },
  resolution_summary: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'escalations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Faults Model
const Fault = sequelize.define('Fault', {
  fault_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fault_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  severity: {
    type: DataTypes.ENUM('Minor', 'Major', 'Critical', 'Blocking'),
    defaultValue: 'Major'
  },
  status: {
    type: DataTypes.ENUM('Reported', 'Investigating', 'In Progress', 'Resolved', 'Closed', 'Deferred'),
    defaultValue: 'Reported'
  },
  fault_type: {
    type: DataTypes.STRING(100)
  },
  reported_by: {
    type: DataTypes.INTEGER
  },
  assigned_to: {
    type: DataTypes.INTEGER
  },
  reported_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  target_fix_date: {
    type: DataTypes.DATEONLY
  },
  actual_fix_date: {
    type: DataTypes.DATEONLY
  },
  root_cause: {
    type: DataTypes.TEXT
  },
  resolution: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'faults',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// =====================================================
// ACTION LOG MODELS
// =====================================================

// Action Log Headers
const ActionLogHeader = sequelize.define('ActionLogHeader', {
  action_log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  log_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  log_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('Active', 'Completed', 'Archived'),
    defaultValue: 'Active'
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'action_log_headers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Action Log Items
const ActionLogItem = sequelize.define('ActionLogItem', {
  action_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action_log_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action_number: {
    type: DataTypes.STRING(50)
  },
  action_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  action_type: {
    type: DataTypes.STRING(100)
  },
  assigned_to: {
    type: DataTypes.INTEGER
  },
  created_by: {
    type: DataTypes.INTEGER
  },
  created_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATEONLY
  },
  completed_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold'),
    defaultValue: 'Pending'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  notes: {
    type: DataTypes.TEXT
  },
  completion_notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'action_log_items',
  timestamps: false
});

// =====================================================
// RELATIONSHIPS / ASSOCIATIONS
// =====================================================

// Project relationships
Project.hasMany(Issue, { foreignKey: 'project_id', as: 'issues' });
Project.hasMany(Risk, { foreignKey: 'project_id', as: 'risks' });
Project.hasMany(Change, { foreignKey: 'project_id', as: 'changes' });
Project.hasMany(Escalation, { foreignKey: 'project_id', as: 'escalations' });
Project.hasMany(Fault, { foreignKey: 'project_id', as: 'faults' });
Project.hasMany(ActionLogHeader, { foreignKey: 'project_id', as: 'actionLogs' });

// Issue relationships
Issue.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Issue.belongsTo(Person, { foreignKey: 'raised_by', as: 'raiser' });
Issue.belongsTo(Person, { foreignKey: 'assigned_to', as: 'assignee' });

// Risk relationships
Risk.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Risk.belongsTo(Person, { foreignKey: 'identified_by', as: 'identifier' });
Risk.belongsTo(Person, { foreignKey: 'owner', as: 'riskOwner' });

// Change relationships
Change.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Change.belongsTo(Person, { foreignKey: 'requested_by', as: 'requester' });
Change.belongsTo(Person, { foreignKey: 'approved_by', as: 'approver' });

// Escalation relationships
Escalation.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Escalation.belongsTo(Person, { foreignKey: 'raised_by', as: 'raiser' });
Escalation.belongsTo(Person, { foreignKey: 'escalated_to', as: 'escalatee' });

// Fault relationships
Fault.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Fault.belongsTo(Person, { foreignKey: 'reported_by', as: 'reporter' });
Fault.belongsTo(Person, { foreignKey: 'assigned_to', as: 'assignee' });

// Action Log relationships
ActionLogHeader.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
ActionLogHeader.belongsTo(Person, { foreignKey: 'created_by', as: 'creator' });
ActionLogHeader.hasMany(ActionLogItem, { foreignKey: 'action_log_id', as: 'items' });

ActionLogItem.belongsTo(ActionLogHeader, { foreignKey: 'action_log_id', as: 'header' });
ActionLogItem.belongsTo(Person, { foreignKey: 'assigned_to', as: 'assignee' });
ActionLogItem.belongsTo(Person, { foreignKey: 'created_by', as: 'creator' });

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sequelize,
  Project,
  Person,
  Issue,
  Risk,
  Change,
  Escalation,
  Fault,
  ActionLogHeader,
  ActionLogItem
};