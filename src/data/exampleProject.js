function makeDate(year, month, day) {
  return new Date(year, month - 1, day)
}

function makeActivity(id, name, start, end, origHrs, completePct, status) {
  return {
    task_code: id,
    task_name: name,
    start_date: start,
    end_date: end,
    target_drtn_hr_cnt: origHrs,
    remain_drtn_hr_cnt: origHrs * (1 - completePct / 100),
    complete_pct: completePct,
    status_code: status,
    task_type: 'TT_Task',
  }
}

// Project runs Jan 2023 — Dec 2025
// Data Date 1: Jul 1 2023
// Data Date 2: Jan 1 2024
export const EXAMPLE_DATA_DATE_A = '2023-07-01'
export const EXAMPLE_DATA_DATE_B = '2024-01-01'
export const EXAMPLE_PROJECT_NAME = 'Example Project'
export const EXAMPLE_PROJECT_NUMBER = 'J999999.001'

export const EXAMPLE_SCHEDULE_A = [
  makeActivity('A-001', 'Site Mobilization',               makeDate(2023,1,1),  makeDate(2023,3,1),  160, 100, 'TK_Complete'),
  makeActivity('A-002', 'Demolition - Block A',            makeDate(2023,2,1),  makeDate(2023,5,1),  320, 100, 'TK_Complete'),
  makeActivity('A-003', 'Excavation - Main Foundation',    makeDate(2023,3,1),  makeDate(2023,6,1),  480, 100, 'TK_Complete'),
  makeActivity('A-004', 'Foundation Concrete - Block A',   makeDate(2023,5,1),  makeDate(2023,8,1),  400,  60, 'TK_Active'),
  makeActivity('A-005', 'Underground Utilities - Phase 1', makeDate(2023,4,1),  makeDate(2023,7,1),  240,  80, 'TK_Active'),
  makeActivity('A-006', 'Structural Steel - Level 1',      makeDate(2023,6,1),  makeDate(2023,9,1),  560,  20, 'TK_Active'),
  makeActivity('A-007', 'Structural Steel - Level 2',      makeDate(2023,8,1),  makeDate(2023,11,1), 560,   0, 'TK_NotStart'),
  makeActivity('A-008', 'Structural Steel - Level 3',      makeDate(2023,10,1), makeDate(2024,1,1),  560,   0, 'TK_NotStart'),
  makeActivity('A-009', 'Concrete Slab - Level 1',         makeDate(2023,7,1),  makeDate(2023,10,1), 320,   0, 'TK_NotStart'),
  makeActivity('A-010', 'Concrete Slab - Level 2',         makeDate(2023,9,1),  makeDate(2023,12,1), 320,   0, 'TK_NotStart'),
  makeActivity('A-011', 'Concrete Slab - Level 3',         makeDate(2023,11,1), makeDate(2024,2,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-012', 'Exterior Facade - Block A',       makeDate(2023,10,1), makeDate(2024,3,1),  480,   0, 'TK_NotStart'),
  makeActivity('A-013', 'Roofing - Block A',               makeDate(2024,1,1),  makeDate(2024,4,1),  240,   0, 'TK_NotStart'),
  makeActivity('A-014', 'MEP Rough-In - Level 1',          makeDate(2023,9,1),  makeDate(2024,1,1),  400,   0, 'TK_NotStart'),
  makeActivity('A-015', 'MEP Rough-In - Level 2',          makeDate(2023,11,1), makeDate(2024,3,1),  400,   0, 'TK_NotStart'),
  makeActivity('A-016', 'MEP Rough-In - Level 3',          makeDate(2024,1,1),  makeDate(2024,5,1),  400,   0, 'TK_NotStart'),
  makeActivity('A-017', 'Interior Framing - Level 1',      makeDate(2023,10,1), makeDate(2024,2,1),  360,   0, 'TK_NotStart'),
  makeActivity('A-018', 'Interior Framing - Level 2',      makeDate(2023,12,1), makeDate(2024,4,1),  360,   0, 'TK_NotStart'),
  makeActivity('A-019', 'Interior Framing - Level 3',      makeDate(2024,2,1),  makeDate(2024,6,1),  360,   0, 'TK_NotStart'),
  makeActivity('A-020', 'Drywall & Insulation - Level 1',  makeDate(2024,1,1),  makeDate(2024,4,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-021', 'Drywall & Insulation - Level 2',  makeDate(2024,3,1),  makeDate(2024,6,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-022', 'Drywall & Insulation - Level 3',  makeDate(2024,5,1),  makeDate(2024,8,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-023', 'Flooring - Level 1',              makeDate(2024,3,1),  makeDate(2024,6,1),  240,   0, 'TK_NotStart'),
  makeActivity('A-024', 'Flooring - Level 2',              makeDate(2024,5,1),  makeDate(2024,8,1),  240,   0, 'TK_NotStart'),
  makeActivity('A-025', 'Flooring - Level 3',              makeDate(2024,7,1),  makeDate(2024,10,1), 240,   0, 'TK_NotStart'),
  makeActivity('A-026', 'Painting - Level 1',              makeDate(2024,4,1),  makeDate(2024,7,1),  200,   0, 'TK_NotStart'),
  makeActivity('A-027', 'Painting - Level 2',              makeDate(2024,6,1),  makeDate(2024,9,1),  200,   0, 'TK_NotStart'),
  makeActivity('A-028', 'Painting - Level 3',              makeDate(2024,8,1),  makeDate(2024,11,1), 200,   0, 'TK_NotStart'),
  makeActivity('A-029', 'Exterior Landscaping',            makeDate(2024,6,1),  makeDate(2024,10,1), 280,   0, 'TK_NotStart'),
  makeActivity('A-030', 'Site Utilities - Final',          makeDate(2024,7,1),  makeDate(2024,11,1), 320,   0, 'TK_NotStart'),
  makeActivity('A-031', 'Commissioning - MEP',             makeDate(2024,9,1),  makeDate(2024,12,1), 240,   0, 'TK_NotStart'),
  makeActivity('A-032', 'Final Inspections',               makeDate(2024,11,1), makeDate(2025,1,1),  160,   0, 'TK_NotStart'),
  makeActivity('A-033', 'Punch List & Closeout',           makeDate(2024,12,1), makeDate(2025,3,1),  200,   0, 'TK_NotStart'),
  makeActivity('A-034', 'Project Demobilization',          makeDate(2025,2,1),  makeDate(2025,4,1),  120,   0, 'TK_NotStart'),
]

export const EXAMPLE_SCHEDULE_B = [
  makeActivity('A-001', 'Site Mobilization',               makeDate(2023,1,1),  makeDate(2023,3,1),  160, 100, 'TK_Complete'),
  makeActivity('A-002', 'Demolition - Block A',            makeDate(2023,2,1),  makeDate(2023,5,1),  320, 100, 'TK_Complete'),
  makeActivity('A-003', 'Excavation - Main Foundation',    makeDate(2023,3,1),  makeDate(2023,6,15), 480, 100, 'TK_Complete'),
  makeActivity('A-004', 'Foundation Concrete - Block A',   makeDate(2023,5,15), makeDate(2023,9,1),  400,  40, 'TK_Active'),
  makeActivity('A-005', 'Underground Utilities - Phase 1', makeDate(2023,4,1),  makeDate(2023,8,1),  240,  55, 'TK_Active'),
  makeActivity('A-006', 'Structural Steel - Level 1',      makeDate(2023,7,1),  makeDate(2023,11,1), 560,  10, 'TK_Active'),
  makeActivity('A-007', 'Structural Steel - Level 2',      makeDate(2023,10,1), makeDate(2024,2,1),  560,   0, 'TK_NotStart'),
  makeActivity('A-008', 'Structural Steel - Level 3',      makeDate(2023,12,1), makeDate(2024,4,1),  560,   0, 'TK_NotStart'),
  makeActivity('A-009', 'Concrete Slab - Level 1',         makeDate(2023,9,1),  makeDate(2023,12,1), 320,   0, 'TK_NotStart'),
  makeActivity('A-010', 'Concrete Slab - Level 2',         makeDate(2023,11,1), makeDate(2024,2,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-011', 'Concrete Slab - Level 3',         makeDate(2024,1,1),  makeDate(2024,4,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-012', 'Exterior Facade - Block A',       makeDate(2023,12,1), makeDate(2024,5,1),  480,   0, 'TK_NotStart'),
  makeActivity('A-013', 'Roofing - Block A',               makeDate(2024,3,1),  makeDate(2024,6,1),  240,   0, 'TK_NotStart'),
  makeActivity('A-014', 'MEP Rough-In - Level 1',          makeDate(2023,11,1), makeDate(2024,3,1),  400,   0, 'TK_NotStart'),
  makeActivity('A-015', 'MEP Rough-In - Level 2',          makeDate(2024,1,1),  makeDate(2024,5,1),  400,   0, 'TK_NotStart'),
  makeActivity('A-016', 'MEP Rough-In - Level 3',          makeDate(2024,3,1),  makeDate(2024,7,1),  400,   0, 'TK_NotStart'),
  makeActivity('A-017', 'Interior Framing - Level 1',      makeDate(2023,12,1), makeDate(2024,4,1),  360,   0, 'TK_NotStart'),
  makeActivity('A-018', 'Interior Framing - Level 2',      makeDate(2024,2,1),  makeDate(2024,6,1),  360,   0, 'TK_NotStart'),
  makeActivity('A-019', 'Interior Framing - Level 3',      makeDate(2024,4,1),  makeDate(2024,8,1),  360,   0, 'TK_NotStart'),
  makeActivity('A-020', 'Drywall & Insulation - Level 1',  makeDate(2024,3,1),  makeDate(2024,6,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-021', 'Drywall & Insulation - Level 2',  makeDate(2024,5,1),  makeDate(2024,8,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-022', 'Drywall & Insulation - Level 3',  makeDate(2024,7,1),  makeDate(2024,10,1), 320,   0, 'TK_NotStart'),
  makeActivity('A-023', 'Flooring - Level 1',              makeDate(2024,5,1),  makeDate(2024,8,1),  240,   0, 'TK_NotStart'),
  makeActivity('A-024', 'Flooring - Level 2',              makeDate(2024,7,1),  makeDate(2024,10,1), 240,   0, 'TK_NotStart'),
  makeActivity('A-025', 'Flooring - Level 3',              makeDate(2024,9,1),  makeDate(2024,12,1), 240,   0, 'TK_NotStart'),
  makeActivity('A-026', 'Painting - Level 1',              makeDate(2024,6,1),  makeDate(2024,9,1),  200,   0, 'TK_NotStart'),
  makeActivity('A-027', 'Painting - Level 2',              makeDate(2024,8,1),  makeDate(2024,11,1), 200,   0, 'TK_NotStart'),
  makeActivity('A-028', 'Painting - Level 3',              makeDate(2024,10,1), makeDate(2025,1,1),  200,   0, 'TK_NotStart'),
  makeActivity('A-029', 'Exterior Landscaping',            makeDate(2024,8,1),  makeDate(2024,12,1), 280,   0, 'TK_NotStart'),
  makeActivity('A-030', 'Site Utilities - Final',          makeDate(2024,9,1),  makeDate(2025,1,1),  320,   0, 'TK_NotStart'),
  makeActivity('A-031', 'Commissioning - MEP',             makeDate(2024,11,1), makeDate(2025,2,1),  240,   0, 'TK_NotStart'),
  makeActivity('A-032', 'Final Inspections',               makeDate(2025,1,1),  makeDate(2025,3,1),  160,   0, 'TK_NotStart'),
  makeActivity('A-033', 'Punch List & Closeout',           makeDate(2025,2,1),  makeDate(2025,5,1),  200,   0, 'TK_NotStart'),
  makeActivity('A-034', 'Project Demobilization',          makeDate(2025,4,1),  makeDate(2025,6,1),  120,   0, 'TK_NotStart'),
]