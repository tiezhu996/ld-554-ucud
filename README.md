# BizStarter 创业与小微企业管理系统

BizStarter 面向创业公司与小微企业，覆盖员工管理、排班调度、财务收支、门店运营四个核心模块。项目采用前后端分离架构：前端 Vue 3 + Element Plus，后端 Express + Sequelize，数据库为 MySQL。

## 功能介绍

- 管理仪表盘：收入支出对比、出勤率、门店营收 TOP、待办事项和快速入口。
- 员工管理：花名册筛选、组织树、入职登记、详情抽屉、转正/调岗/离职入口基础结构。
- 排班管理：周视图、自动排班、换班申请流程、月度工时统计。
- 财务管理：收支记录、记账表单、分类统计、利润报表导出。
- 门店管理：卡片/表格视图、业绩对比、人员配置、门店详情。
- 横切能力：JWT 认证、RBAC、按钮权限、数据范围过滤、统一异常处理、操作审计。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3、Vite、TypeScript、Element Plus、Pinia、Vue Router、Axios、ECharts |
| 后端 | Node.js、Express、TypeScript、Sequelize、JWT、bcryptjs |
| 数据库 | MySQL 8 |
| 部署 | Docker Compose、Nginx |

## 快速启动

```bash
docker compose up --build
```

访问地址：

- 前端：http://localhost:38404
- 后端：http://localhost:38504/api
- 健康检查：http://localhost:38504/api/health

默认账号：

| 角色 | 账号 | 密码 |
|---|---|---|
| Owner | owner | password123 |
| Manager | manager | password123 |
| Employee | employee | password123 |

## 本地开发

前端：

```bash
cd frontend
npm install
npm run dev
```

后端：

```bash
cd backend
npm install
npm run dev
```

本地后端需要可连接 MySQL，并配置 `DB_HOST`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`、`JWT_SECRET`。

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| COMPOSE_PROJECT_NAME | Compose 项目前缀 | ldbizstarter |
| FRONTEND_PORT | 前端暴露端口 | 38404 |
| BACKEND_PORT | 后端暴露端口 | 38504 |
| DB_HOST | 数据库主机 | mysql |
| DB_PORT | MySQL 宿主机端口 | 33064 |
| DB_NAME | 数据库名 | bizstarter |
| DB_USER | 数据库用户 | bizstarter |
| DB_PASSWORD | 数据库密码 | bizstarter_pass |
| DB_ROOT_PASSWORD | MySQL root 密码 | root_pass |
| JWT_SECRET | JWT 签名密钥 | change_me_for_production |
| NODE_ENV | 运行环境 | production |

## Docker 说明

`docker-compose.yml` 顶层 `name` 为 `ldbizstarter`，未使用 `version` 字段。服务容器名均使用 `${COMPOSE_PROJECT_NAME:-ldbizstarter}` 前缀。MySQL 使用命名卷 `mysql_data` 持久化，数据库和后端都配置 healthcheck，后端等待数据库健康，前端等待后端健康。前端 Nginx 将 `/api` 反向代理到 `backend:38504`。

## 目录结构

```text
frontend/   Vue 3 前端应用
backend/    Express + Sequelize API
database/   init.sql 和 seed.sql
```

## 枚举使用位置清单

| 枚举 | 值 | 文件位置 |
|---|---|---|
| EmployeeStatus | ON_PROBATION / ACTIVE / RESIGNED | `frontend/src/constants/enums.ts`、`frontend/src/pages/employees/EmployeeList.vue`、`frontend/src/pages/employees/EmployeeForm.vue`、`frontend/src/stores/employeeStore.ts`、`backend/src/constants/enums.ts`、`backend/src/models/employee.model.ts`、`backend/src/services/dashboard.service.ts`、`database/init.sql`、`database/seed.sql` |
| ShiftType | MORNING / AFTERNOON / NIGHT / REST | `frontend/src/constants/enums.ts`、`frontend/src/pages/schedule/ScheduleWeek.vue`、`frontend/src/pages/schedule/ScheduleForm.vue`、`frontend/src/stores/shiftStore.ts`、`backend/src/constants/enums.ts`、`backend/src/models/shift.model.ts`、`backend/src/services/shift.service.ts`、`database/init.sql`、`database/seed.sql` |
| TransactionType | INCOME / EXPENSE | `frontend/src/constants/enums.ts`、`frontend/src/pages/finance/FinanceList.vue`、`frontend/src/pages/finance/FinanceForm.vue`、`frontend/src/stores/transactionStore.ts`、`frontend/src/pages/Dashboard.vue`、`backend/src/constants/enums.ts`、`backend/src/models/transaction.model.ts`、`backend/src/services/dashboard.service.ts`、`database/init.sql`、`database/seed.sql` |
| TransactionCategory | SALARY / PURCHASE / RENT / UTILITY / SALES / OTHER | `frontend/src/constants/enums.ts`、`frontend/src/pages/finance/FinanceList.vue`、`frontend/src/pages/finance/FinanceForm.vue`、`frontend/src/stores/transactionStore.ts`、`backend/src/constants/enums.ts`、`backend/src/models/transaction.model.ts`、`database/init.sql`、`database/seed.sql` |
| UserRole | OWNER / MANAGER / EMPLOYEE | `frontend/src/constants/enums.ts`、`frontend/src/hooks/usePermission.ts`、`frontend/src/router/guards.ts`、`frontend/src/router/routes/*.ts`、`frontend/src/main.ts`、`backend/src/constants/enums.ts`、`backend/src/constants/permissions.ts`、`backend/src/models/user.model.ts`、`backend/src/models/employee.model.ts`、`backend/src/middlewares/rbac.middleware.ts`、`backend/src/services/scope.service.ts`、`backend/src/routes/*.routes.ts`、`database/init.sql`、`database/seed.sql` |
| FinanceAuditAction | CREATE_TRANSACTION / UPDATE_TRANSACTION / DELETE_TRANSACTION / REVIEW_TRANSACTION | `frontend/src/constants/enums.ts`、`frontend/src/pages/finance/FinanceAuditLogs.vue`、`backend/src/constants/enums.ts`、`backend/src/services/transaction.service.ts`、`backend/src/services/audit.service.ts`、`database/seed.sql` |

## 全局异常处理

后端通过 `backend/src/middlewares/error-handler.middleware.ts` 捕获未处理异常，统一返回 `{ code, message, data }`，生产环境隐藏堆栈。前端通过 `frontend/src/utils/request.ts` 的 Axios 响应拦截器统一处理 401、403、500，并使用 Element Plus `ElMessage` 提示。

## 操作日志说明

财务变更全程留痕。记账（`CREATE_TRANSACTION`）、修改（`UPDATE_TRANSACTION`）、删除（`DELETE_TRANSACTION`）、审核（`REVIEW_TRANSACTION`）四类动作都会在**同一个数据库事务**内写入 `audit_logs` 表：先改账目、再写日志，任一步失败整体回滚，因此**日志写入失败时账目变动不会生效**，前端保存页会明确提示“保存失败，账目未发生变动”且不关闭表单。

每条财务日志包含：经办人（`operatorId`，关联用户）、动作（`action`）、门店（`storeId`）、目标账目 ID（`targetId`）、修改前内容（`oldValue`）、修改后内容（`newValue`，完整 JSON 快照）、IP（`ip`）和发生时间（`timestamp`）。

操作日志页（`/finance/audit-logs`）：

- 老板（OWNER）可查**全部门店**，并可按门店进一步筛选；店长（MANAGER）只能查看**自己负责门店**的日志，数据范围在后端服务层强制过滤。
- 支持按**经办人、动作、日期区间**组合筛选，并可查看每条日志修改前后的具体内容。

其他模块（员工、排班、门店）的关键操作仍由 `audit.middleware.ts` 审计到同一张 `audit_logs` 表。

## RBAC 权限矩阵

| 模块 | Owner | Manager | Employee |
|---|---|---|---|
| 仪表盘 | 查看 | 查看门店范围 | 查看个人范围 |
| 员工 | 增删改查 | 新增/查看/修改门店范围 | 查看本人/门店范围 |
| 排班 | 增删改查/自动排班 | 新增/查看/修改门店范围 | 查看个人排班 |
| 财务 | 增删改查/审核 | 新增/查看/修改/查看日志（限本门店） | 无 |
| 财务操作日志 | 查全部门店 | 仅查本门店 | 无 |
| 门店 | 增删改查 | 查看/修改负责门店 | 无 |
| 系统设置 | 全部 | 无 | 无 |

## License

MIT
