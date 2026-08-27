# Community Question Episode Agent Specification

版本：`qe.v1`  ·  适用输入：`.local/community-import/*/messages.jsonl`

本文件是 Luna 子代理批量抽取 Question Episode（问题片段）的约束。它是
私有自动处理流水线的中间格式，不是公开发布格式。代理只能引用
`corpus_message_id`；不得输出 `sender`、`account_name`、平台账号、群成员
列表、原始链接/二维码或可由组合信息识别个人的内容。

## 1. 语料观察与设计依据

本次只读抽样覆盖合并语料的全部 56,403 条消息：两个导入群组各按 14 个
日历月份分层，共 28 个群组-月份层；有候选问题的层每层最多取两个相邻窗口，
合计 52 个窗口（每窗最多 5 条相邻消息）。另检查了图片、动画/普通表情、聊天记录
转发、撤回/系统通知、时间相近的碎片问题，以及跨群的精确重复。

抽样中可见的稳定模式包括：问题和回答可能相隔数条消息；同一问题会被
多人用不同措辞重复；图片可能是问题本体；“今天/明天/这次”等相对时间
很多；以及一个群中的答案并不自动适用于另一个群。示例仅以消息 ID
标识：`cam_5974d790613dfdab87ef16a3`（明确求助）、
`cam_ff9a34cb121a2affc7e747b5` → `cam_bd8e128d7f5c22d2fd55e53f`（问答）、
`cam_44051f6ede1af0b2f94bf12b` → `cam_c4743d7bfb950fc1bd0eb059`（带后续说明）、
`cam_6770c9d6c92f52d5623d9033` → `cam_b2b9f5aa22b38bbc24565caf`（格式/规则问答）。
这些 ID 只用于可追溯性，不代表可公开展示原文。

## 2. 严格输出 schema

每个候选必须输出一个 JSON 对象；不得增加未列出的顶层或子字段。数组可为空，
但必填字段不能省略。所有时间用 ISO-8601 UTC；输入的 epoch timestamp 不得
未经说明转换成当地时间。

```json
{
  "schema_version": "qe.v1",
  "candidate_id": "cpc_<24 hex from the input candidate>",
  "episode_id": "qe_<the input candidate_id's 24-hex suffix>",
  "validity": {
    "status": "valid|invalid",
    "reasons": ["枚举化原因；有效时 []"]
  },
  "canonical_question_zh": "去识别化、可独立理解的问题",
  "canonical_question_en": "De-identified, self-contained English question",
  "source": {
    "source_group_key": "<导入器提供的非公开、不含账号信息的群组键>",
    "message_ids": ["cam_<24 hex>"],
    "first_at": "2026-04-01T00:00:00Z",
    "last_at": "2026-04-01T00:00:00Z",
    "timezone_basis": "utc|unknown"
  },
  "question": {
    "intent": "一句话描述要解决的意图",
    "form": "explicit|implicit|follow_up",
    "category": "admissions|academic-life|research-laboratories|campus-services|living-in-japan|visas-administration|careers|other",
    "scope": "问题适用的群体/项目范围；未知写 null"
  },
  "entities": ["证据支持的非个人实体、课程、手续或地点"],
  "tags": ["受控标签；最多 5 个"],
  "evidence": {
    "question": [
      {"corpus_message_id": "cam_<24 hex>", "role": "question|context", "supports": ["q1"]}
    ],
    "answer": [
      {"corpus_message_id": "cam_<24 hex>", "role": "answer|clarifier|counterpoint", "support": "direct|qualified|contradicts|none", "supports": ["a1"]}
    ],
    "excluded": [
      {"corpus_message_id": "cam_<24 hex>", "reason": "sticker|system|unrelated|duplicate|unreadable-media|pii-risk"}
    ]
  },
  "answer": {
    "status": "answered|partial|unanswered|conflicted",
    "synthesis_zh": "只由证据支持的去识别化摘要；无答案写 null",
    "claims": [
      {"claim_id": "a1", "text_zh": "单一可核验断言", "qualification": "direct|inferred|unknown", "evidence_ids": ["cam_<24 hex>"]}
    ],
    "caveats": ["时间、范围或证据局限；没有则 []"]
  },
  "answer_evidence_ids": ["cam_<24 hex>"],
  "temporal": {
    "class": "stable|time_sensitive|unknown",
    "as_of": "2026-04-01T00:00:00Z|null",
    "valid_from": "YYYY-MM-DD|null",
    "valid_until": "YYYY-MM-DD|null",
    "cohort_or_cycle": "入学/课程/申请批次；未知写 null",
    "relative_date_resolution": "resolved|ambiguous|not_applicable",
    "needs_current_verification": true,
    "evidence_ids": ["cam_<24 hex>"]
  },
  "time_sensitive": true,
  "media_dependency": "none|supplemental|required|unavailable",
  "media": {
    "dependency": "none|supplemental|required|unavailable",
    "media_ids": ["cam_<24 hex>"],
    "readability": "not_applicable|readable|unreadable|unknown",
    "claims_affected": ["a1"]
  },
  "conflict": {
    "present": false,
    "claim_ids": [],
    "resolution": "none|qualified_by_date|qualified_by_scope|unresolved"
  },
  "privacy": {
    "risk": "low|medium|high",
    "actions": ["remove_personal_name|remove_account|remove_contact|generalise_location|remove_link|none"],
    "safe_to_surface": false
  },
  "confidence": {
    "overall": 0.0,
    "question": 0.0,
    "answer": 0.0,
    "provenance": 0.0,
    "temporal": 0.0,
    "privacy": 0.0
  },
  "decision": {
    "label": "accept|hold|reject",
    "reasons": ["枚举化原因；没有则 []"],
    "review_required": true
  }
}
```

### 2.1 类型、不变量与长度

- ID 必须完全匹配 `^cam_[0-9a-f]{24}$`，且必须存在于输入；不得用 source
  line、source message ID、sender 或 account name 代替。
- `candidate_id` 必须原样回传输入候选的 `candidate_id`（匹配
  `^cpc_[0-9a-f]{24}$`），不得由模型另造；它只用于批量回写，不是公开字段。
- `episode_id` 必须把同一 `candidate_id` 的 `cpc_` 前缀机械替换为 `qe_`；不得
  自行计算、缩写或随机生成。
- `message_ids` 按输入时间升序，至少包含 `evidence.question` 中的一个
  `question` ID；所有 evidence ID 必须属于 `message_ids`，且不得跨
  `source_group_key`。对于 pilot 的 260 个候选，允许的 ID 集合严格是该
  候选的 `anchor`、`context_before`、`context_after` 中出现的 ID；不得引用
  候选窗口外的消息，即使原始语料中存在相关答案。
- `validity.status=invalid` 时 `decision.label` 必须是 `reject`，并且
  `validity.reasons`、`decision.reasons` 至少各一项；`validity.status=valid` 时可为
  `accept|hold`（开放问题仍可能是 valid + hold）。
- 顶层 `canonical_question_zh`、`canonical_question_en` 及 `question.intent` 必须是单一问题，
  分别不超过 160/160/240 个 Unicode 字符；`synthesis_zh` 不超过 1,000 字符；
  单个 claim 不超过 240 字符；
  各 evidence 列表不超过 12 项，`message_ids` 不超过 30 项。
- `confidence.*` 是闭区间 `[0,1]`，最多两位小数。`overall` 取
  `min(question, answer, provenance, temporal, privacy)`；`unanswered` 时 answer
  只能为 0.00–0.30，除非另有独立的“不回答也可发布”人工策略。
- `canonical_question_zh/en`、`answer.synthesis_zh`、`claims[].text_zh` 不得含
  人名、账号、电话号码、邮箱、精确住址、支付账号、私聊指令或原消息长引文。
  不能安全泛化时将 `privacy.risk` 设为 `high` 并搁置/拒绝。
- `answer.status=unanswered` 时 `answer.synthesis_zh=null`、`claims=[]`；
  `answer.status=conflicted` 时 `conflict.present=true` 且必须列出相互冲突的
  `claim_ids`，不能以多数票强行选一个答案。
- 顶层 `time_sensitive` 必须在 `temporal.class=time_sensitive` 时为 `true`；
  `stable` 时为 `false`，`unknown` 时也必须为 `true`（未知按高风险处理）。
- 顶层 `media_dependency` 必须与 `media.dependency` 相同；`none` 时
  `media_ids=[]`、`claims_affected=[]`；
  `required|unavailable` 不得有仅凭模型常识补写的断言。
- `decision.label=accept` 必须 `privacy.safe_to_surface=true`；
  `decision.label=reject` 必须至少一个明确的 `reasons`。

## 3. 有效/无效判定

### 3.1 `valid`（抽取层面）

一个候选在下列条件同时满足时才是有效 Question Episode：

1. 至少有一条文本消息表达信息请求、核实请求、后续追问或明确的操作求助；
   句末没有问号也可以，但必须能从局部上下文重建问题意图。
2. 问题在当前群组的局部窗口内可独立理解，且 `question.evidence` 至少有
   一个 `question` ID；上下文缺失可以让它有效但 `scope`/置信度必须降级。
3. 选入消息都对该问题有语义贡献；闲聊、纯情绪、表情、系统通知不能单独
   组成 episode。
4. 经过去识别化后仍能安全表达；否则不是可发布候选。

有效不等于已回答：`answer.status=unanswered` 是有效的开放问题状态，但在
默认发布策略下只能人工审核，不得自动接受。

### 3.2 `invalid`（直接拒绝）

命中任一项就设 `decision.label=reject`，并在 `reasons` 使用下列枚举之一：

`no_question`、`banter_or_reaction`、`system_or_membership_notice`、
`only_media_unreadable`、`unrelated_messages`、`multi_question_unseparable`、
`no_local_context`、`privacy_high`、`malicious_or_sensitive_request`、
`malformed_source`。

跨群精确重复本身不是无效理由：必须各自保留 group-local episode，之后只作
检索/比对信号。群组内重复问题也不要机械合并，除非同一窗口明确是追问。

## 4. 证据选择与答案规则

- 问题证据：必选提出问题的原消息 ID；只加入能解决代词、主题、适用范围、
  日期或单位的前后文。优先同一会话中紧邻的明确澄清，不要把相邻闲聊当背景。
- 答案证据：优先直接回答问题的文本；其次是明确限定答案范围的澄清；若后续
  消息明确反驳前答案，必须同时保留两边并设冲突。表情、贴纸、单独“+1”、
  感谢和无关经验不能作为答案证据。
- 每个 `claims[]` 必须至少一个 evidence ID；无法逐断言归因的内容删除，不能
  用世界知识、搜索结果或模型常识补全。`qualification=inferred` 仅可用于
  明确的低风险归纳，不能用于自动接受。
- 顶层 `answer_evidence_ids` 必须是 `evidence.answer[].corpus_message_id`
  的去重子集；`entities`、`tags` 只能从窗口证据中抽取或归一化，不能凭常识
  添加，并分别限制为最多 10 个实体、5 个标签。
- 证据的原话只在私有审核器中按 ID 回查；代理输出只给短的去识别化改写，不能
  复制原消息、暴露发言者或附带其账号。
- 回答晚于问题的消息仍可纳入，但必须在同一 `source_group_key` 且在候选输入
  窗口内。pilot 窗口最多含前 4 条文本消息、后 24 条文本消息，后向时间上限
  30 分钟；不得自行向原始语料扩展。窗口不足以支持答案时标 `unanswered`
  或 `hold`，不能补引窗口外 ID。

## 5. 时间、冲突与图片依赖

### 时间敏感性

含“今天/明天/现在/本学期/这次”、截止日期、费用/汇率、课程安排、招生批次、
签证/行政政策、设施营业状态或任何未来承诺时，设 `time_sensitive`。用输入
timestamp 的 UTC 日期解析相对词；无法确定当地时区或指代对象时设
`relative_date_resolution=ambiguous`、`temporal.class=unknown` 并搁置。
历史答案不得改写成当前事实：标出 `as_of`，并在需要时
`needs_current_verification=true`。对外摘要应明确“截至某时/某批次”，不能
暗示永久有效。

### 冲突

先按日期、批次、课程/校区范围拆分；如果两条答案可以同时成立，用
`qualified_by_date` 或 `qualified_by_scope`，并在 caveat 写清范围。若仍互斥，
设 `unresolved`、`answer.status=conflicted`、`review_required=true`。不得按回答
数量或发送顺序投票；较晚消息也不自动权威。

### 图片/附件

图片仅是补充（文字已完整表达问题）时为 `supplemental`；图片中的表格、表单、
二维码、截图文字是理解问题或回答所必需时为 `required`。只有可靠可读的输入
解析才可标 `readable`，不能臆测 OCR；看不清或只有图片而无可理解文字时为
`unavailable/unreadable` 并 `hold` 或 `reject`。二维码、联系方式、账号和
图片中个人信息不得进入改写文本。

## 6. 置信度与自动质量门槛

代理须分别评分，不得用“语言流畅”替代证据置信度：

- `question`：问题边界、意图、范围是否可由 ID 直接支持；
- `answer`：每个断言是否有直接证据（开放问题低分）；
- `provenance`：ID、顺序、群组边界、时间戳是否可回查；
- `temporal`：日期/批次和新旧风险是否明确；
- `privacy`：去识别化是否彻底（低风险才可高分）。

### 自动接受（允许进入 embedding 与合并阶段）

仅在全部条件成立时：`question >= 0.92`、`answer >= 0.90`、
`provenance >= 0.95`、`temporal >= 0.90`、`privacy >= 0.95`、`overall >= 0.90`；问题有至少一条
直接证据；答案为 `answered` 或有明确范围的 `partial`；无未解决冲突；媒体
不是 `required/unavailable`；没有高风险 PII；若 `time_sensitive`，有清楚
`as_of`/批次且 `needs_current_verification=false`。满足条件时
`decision.review_required=false`；这只允许 Episode 进入后续自动处理，并不授权
写入生产数据库，且绝不自动跨群合并。

### 自动搁置（默认）

出现以下任一项就 `hold`：任一核心分数在 `0.60–0.91`；`answer=unanswered`；
时间含糊或需当前核验；图片必需/不可读；答案互相冲突；范围或代词只能靠
猜测；存在中等 PII 风险；跨群是 `same_intent|related|unknown`；需要合并多个
问题才能成文。`hold` 必须设置 `decision.review_required=true` 并保留所有支持/反驳
ID；当前无人审 pilot 会自动排除这些记录，而不是等待人工处理。

### 自动拒绝

`question < 0.60`，或命中 3.2 的硬拒绝条件；或者隐私风险高、只有不可读
媒体、来源 ID 无法回查。拒绝不删除原语料，只阻止该候选进入发布队列。

## 7. Luna 子代理的精确作业步骤

对每个批次按以下顺序执行，不能跳步：

1. **读取契约。** 对 pilot 只读取分配的 `candidates.jsonl` 行（`candidate_id`、
   `anchor`、`context_before`、`context_after`）和本 schema；建立该行允许的
   `corpus_message_id` 集合。绝不读取或输出 participants 数据，也不回查候选行外的原始消息。
2. **规范化输入。** 仅对内容做 NFKC/空白规范化用于分类；保留原 ID、原顺序、
   原 timestamp、type 和媒体占位符。按 `source_group_key` 分桶，绝不跨桶组窗。
3. **标记候选锚点。** 找出显式问句、信息请求、操作求助和紧接的 follow-up；
   纯陈述、玩笑、情绪、系统事件、撤回通知、表情或广告不作锚点。
4. **构造局部窗口。** 对 pilot 输入严格使用 anchor 加 `context_before`（最多 4 条）
   和 `context_after`（最多 24 条、且不超过 30 分钟）；不得读取或引用窗口外
   消息。遇到新主题或连续 3 条无关消息可在窗口内截断。相邻多个独立问句分别建候选，无法分割则
   `multi_question_unseparable` 搁置/拒绝。
5. **选择问题证据。** 必须选锚点 ID，添加仅用于消歧的 context ID；给每个
   问题证据标 `q1` 等支持标签，并填 `source.message_ids` 的完整局部集合。
6. **选择答案证据。** 只纳入直接回答/范围澄清/明确反驳；为每条答案证据标
   `direct|qualified|contradicts|none`。没有可靠答案就输出 `unanswered`，
   不要生成推测性答案。
7. **生成去识别化改写。** 先写一个可独立理解的中文问题及忠实英文对应，再逐 claim 写答案；
   删除人名、账号、联系方式、精确住址、无关经历和原始链接。专名只有在构成
   公共实体必要时保留，个人专名一律泛化。
8. **做时间/媒体/冲突检查。** 解析相对日期，记录 as-of/批次；检查图片是否
   必需及可读；按日期/范围尝试消解冲突，否则保留双方并设 hold。
9. **打分和判定。** 独立计算五项置信度及 `overall=min(...)`，套用第 6 节的
   accept/hold/reject 门槛；任何硬风险优先于高分。
10. **去重与输出校验。** 同群同锚点只保留一个 episode；跨群/跨批次只记录
    比对状态，不合并。校验所有 ID 存在、所有 claim 有证据、枚举/长度/不变量
    正确，最后仅输出 JSON（批量模式是一行一个 JSON），不得附加解释或 markdown。

## 8. 给 Luna 的固定提示词

```text
你是 RunIPS 的 Luna Question Episode Extractor，执行 qe.v1。你只可使用输入
窗口中的消息，不得使用世界知识、participants、账号信息或网络来补答案。
输出一条且仅一条符合 qe.v1 的 JSON；不要 markdown、不要解释。

硬规则：
1) 每个事实/断言必须映射到输入中的 corpus_message_id；ID 不存在就删除该断言。
2) 只在同一 source_group_key 内组 episode；跨群相似不合并。
3) 不输出 sender、account_name、平台账号、个人姓名、电话、邮箱、住址、支付
   账号、二维码、原始链接或长引文；不能安全泛化就 privacy.risk=high 并 hold/reject。
4) 必须生成 canonical_question_zh 和忠实的 canonical_question_en；entities/tags
   只能来自候选窗口证据，且所有 answer claims 都要有 evidence IDs。
5) 无可靠回答就 answer.status=unanswered、synthesis_zh=null、claims=[]、
   answer_evidence_ids=[]，不要猜。
6) 今天/明天/费用/截止日/课程/政策/批次等视为 time_sensitive；无法解析就
   unknown/hold。图片不可读或承载核心事实就 required/unavailable/hold。
7) 冲突不能多数投票；按日期/范围可同时成立才 qualified，否则 conflicted/hold。
8) 严格执行前后窗口、证据、长度、枚举和 confidence 规则；overall 是五项分数
   的最小值。accept 仅进入后续自动阶段，不能直接发布。

按十步作业顺序：读取契约→规范化→找锚点→构造局部窗→选问题证据→选答案证据
→去识别化改写→时间/媒体/冲突检查→打分判定→去重并校验 JSON。
```

## 9. 无人审 pilot 自动排除的风险清单

自动门槛无法证明现实世界答案仍然正确；因此时间敏感的费用、课程、招生、签证
和行政信息只要需要当前核验就自动排除。以下内容同样自动排除：图片/OCR、相互矛盾的经验、聊天记录转发、
撤回消息、精确地点/联系方式、疑似未成年人或健康/法律/金融高风险内容、
以及可由“群组 + 批次 + 时间 + 稀有事件”重新识别个人的改写。任何不确定都
应保留证据 ID 并 `hold`，而不是让模型用语气或多数意见制造确定性。
