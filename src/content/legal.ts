import { Lang } from '@/i18n/translations';

export type LegalDocumentKind = 'privacy' | 'terms';

interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocumentContent {
  eyebrow: string;
  title: string;
  summary: string;
  updatedLabel: string;
  updatedAt: string;
  sections: LegalSection[];
  relatedLabel: string;
  relatedHref: string;
  relatedText: string;
  referenceLabel?: string;
  references?: Array<{ label: string; href: string }>;
}

const zhPrivacy: LegalDocumentContent = {
  eyebrow: 'RUNIPS / PRIVACY',
  title: '隐私保护说明',
  summary: '本说明按照欧盟《通用数据保护条例》（GDPR）的透明度原则，说明 RunIPS 处理哪些数据、处理原因、保存地点和期限，以及你如何行使数据权利。公开匿名不代表平台内部不处理任何数据，也不保证绝对无法推测投稿者身份。',
  updatedLabel: '生效及最后更新',
  updatedAt: '2026 年 8 月 26 日',
  sections: [
    {
      title: '1. 数据控制者与适用范围',
      paragraphs: [
        '数据控制者是 RunIPS 项目运营方，一个独立、非商业的学生项目。RunIPS 不隶属于、不代表也未获得早稻田大学背书。控制者可通过站内 Contact 页面联系；隐私、访问、更正、导出、反对、限制处理或删除请求均可从该页面提交。',
        'RunIPS 以 GDPR 的核心要求作为所有用户的数据保护基线，并在 GDPR 对某位用户或某项处理具有法律效力时履行其强制要求。本说明不是对任何政府认证或绝对合规状态的宣称。',
      ],
    },
    {
      title: '2. 我们处理的数据',
      bullets: [
        '账号与认证数据：匿名账号的随机内部 ID、身份记录、会话和登录时间。若未来启用 Google 登录并由你主动选择，还会处理认证所需的邮箱、显示名称等基础资料。',
        '投稿数据：导师评分、研究压力、六项研究指导评分、是否愿意再次选择、标签、文字评论、学生阶段、导师关系、主要沟通语言、发布时间和修改时间。三个背景项必须由你主动选择，其中可明确选择“不公开”；文字评论可为 0–2000 字。',
        '交流中心投稿数据：主题类型、标题、正文、分类、标签、回复、引用关系、状态、已采纳回复、重复主题关联、作者的内部账号关联，以及发布、修改和最后活动时间。',
        '交互与联系数据：评价投票、主题订阅、站内通知、内容举报、Contact 反馈、可选回复方式、处理状态和相关时间。',
        '运行与安全数据：IP 地址、请求路径（不记录查询字符串）、浏览器或设备信息、请求时间、错误和安全事件。语言偏好与登录会话也保存在你的浏览器中。',
        '旅行指南查询数据：你主动搜索时，RunIPS 处理出发机场、FUK 或 KKJ 目的地、出发日期、固定的经济舱条件和查询时间。护照签发国、出票方式与行李安排只在浏览器中生成转机筛查，不会发送给航班搜索接口，也不会关联到账号。',
        'RunIPS 不要求特殊类别个人数据。请勿在评价、主题或回复中提交自己或他人的健康、政治、宗教、生物识别、性生活、精确行程、学号、联系方式、未公开研究、私人聊天原文或其他私人及敏感信息。',
      ],
    },
    {
      title: '3. 目的与 GDPR 合法基础',
      bullets: [
        '履行服务约定（GDPR 第 6(1)(b) 条）：创建和维护你要求的账号；保存、公开展示和允许管理你的评价、交流中心主题与回复；以及在你发布主题或回复时自动关注该主题并生成站内通知。你可随时在主题页取消关注。没有账号与必要投稿数据，我们无法提供这些功能；评价背景的具体值和文字评论并非必要。',
        '合法利益（第 6(1)(f) 条）：审核和管理公开内容、连接重复主题、防止重复提交和滥用、调查安全事件、维护备份、排查故障、处理反馈并改进非商业学生指南。我们在开展这些处理前考虑其必要性以及投稿者、回复者、被评价者和其他受影响人员的权利；你可以通过 Contact 提出反对。',
        '法律义务（第 6(1)(c) 条）：在适用法律要求时保存或披露必要记录、处理有效法律请求或履行数据保护与安全义务。',
        '经请求采取措施（第 6(1)(b) 条）或合法利益（第 6(1)(f) 条）：回复你主动提交的 Contact 请求。可选回复方式只用于该请求。',
        '履行你主动请求的旅行搜索（第 6(1)(b) 条）：向航班搜索服务提交最少的路线、日期和舱等条件，返回同日航班、转机组合和指示性票价。RunIPS 无法在不处理这些查询字段的情况下提供实时搜索；护照、出票和行李答案并非该查询所必需。',
        '如未来考虑处理来自微信群聊或其他非直接来自当事人的记录，RunIPS 会在开始前另行确定并记录适用的合法基础，进行必要性与权利衡量，并在 GDPR 第 14 条要求时向相关人员提供间接取得数据的透明信息。本说明不表示该导入功能已经启用。',
      ],
    },
    {
      title: '4. 公开展示、匿名边界与自动处理',
      bullets: [
        '公开评价可能显示评分、是否愿意再次选择、标签、发布时间、你主动公开的背景项和自愿填写的评论；公开视图不包含姓名、邮箱、账号 ID 或内部用户 ID。',
        '交流中心的主题标题、正文、分类、标签、状态、回复和时间信息会向全球互联网公开，可被阅读、链接或复制。公开视图不显示内部账号 ID；订阅和站内通知只对相关账号和获授权运营人员可见。',
        '少数获授权的 RunIPS 运营人员可能为运维、备份、安全调查、审核、举报或权利请求访问内部记录。Contact 反馈只进入私有收件箱。',
        '独特经历、时间、研究主题或写作方式仍可能让熟悉情况的人推测作者或第三方。请主动省略可识别细节，不要把交流中心当作私密沟通渠道。任何网络服务都无法承诺绝对安全或绝对不可识别。',
        '若未来开展群聊知识整理，原始记录只能在受限的私有暂存区停留经记录的短期审核周期；公开发布只能是经去识别化改写和人工复核的问答，不得公开原聊天、发送者标识或无关个人信息。如改写后仍有可识别风险，将继续按个人数据处理。',
        'RunIPS 不出售个人数据，不使用广告画像或第三方行为分析，也不进行产生法律或类似重大影响的自动化决策。',
      ],
    },
    {
      title: '5. 接收者、存储地点与跨境传输',
      paragraphs: [
        '应用、PostgreSQL 数据库和认证服务自建部署在新加坡的 Tencent Cloud International 基础设施上；相应基础设施运营实体可能仅在提供计算、网络、安全与支持所需范围内作为处理者接触数据。匿名导师评价以及交流中心主题与回复会向全球互联网公开。',
        '旅行指南的实时搜索由美国 SerpApi, LLC 提供。RunIPS 后端只向其发送出发机场、FUK 或 KKJ、日期、经济舱设置和 RunIPS 自身的 API 凭证；不转发浏览器 IP、账号 ID、护照、出票或行李答案。SerpApi 代表 RunIPS 查询 Google Flights，并说明搜索参数和结果可能在其 Search Archive 中最多可取回 31 天。点击 Google Flights 或 ITA Matrix 外部链接后，浏览器将直接访问相应第三方，其自身条款与隐私政策适用。',
        '新加坡不在欧洲经济区内。对于受 GDPR 第五章约束的传输，Tencent Cloud International 的现行《Data Processing and Security Agreement》在适用时纳入欧盟委员会 2021/914 号控制者至处理者标准合同条款（SCC，Module 2），并列明安全措施和分处理者安排。可通过本页官方参考查阅。若未来增加其他处理者，我们会先建立适用的传输机制并更新本说明。',
        '航班服务的外发查询按数据最小化设计，不含直接标识符，也不与 RunIPS 账号关联。若某项查询在具体情形下仍构成个人数据并受 GDPR 第五章约束，RunIPS 将在适用的传输保障成立前停止该个人数据传输；不能仅因服务商自称安全或合规而取代所需的法律机制。',
      ],
    },
    {
      title: '6. 保存期限与账号删除',
      bullets: [
        '账号、导师评价、交流中心主题与回复、投票和举报保存至你删除账号、单独删除内容或不再需要提供服务；因有效法律义务必须保留的最少记录除外。你发布主题或回复时会自动关注该主题；该关注记录保存至你在主题页取消关注、相关主题被删除或你删除账号。通知只保存至提供和管理该功能不再需要。',
        'Contact 反馈保存至请求处理完成及合理跟进结束，并按必要性定期复核；不再需要时删除或去标识化。',
        '若未来开展群聊知识整理，原始文件和尚未发布的候选内容只会在私有暂存区保留经记录的短期人工审核所需时间，完成或放弃该批处理后删除原始文件。启用前会公布实际审核期限和处理细节。',
        '应用访问日志最多保留 14 天。为调查持续中的安全事件或履行法律义务而隔离的最少记录，只保留至该目的完成。',
        '旅行指南结果只在服务器内存中缓存最多 10 分钟，不写入 RunIPS 数据库，服务重启时即消失；缓存键只含机场、日期、币种与舱等，不含 IP、账号或护照信息。SerpApi 说明已完成搜索可在其 Search Archive 中最多取回 31 天；其保留适用 SerpApi 自身政策。',
        '数据库每天制作受控备份，滚动保留最多 14 天。线上删除立即生效；备份残留在轮换完成后消失，且不会用于恢复已删除账号或重新公开内容。',
        '登录用户可在“账号与数据”页面提交自助删除表单。删除会清除认证账号、身份、会话、评价、评价投票、交流中心订阅、通知和举报、仍关联的 Contact 反馈，以及可按账号 ID 定位的认证审计记录。你发布的交流中心主题和回复会清除作者关联及标题、正文等用户内容；如为维持他人的回复结构而保留记录，只会留下不含用户内容、作者身份或内部账号 ID 的“已删除”占位符。用于维持线程引用的主题或回复记录编号与时间戳可能继续保留。',
      ],
    },
    {
      title: '7. 你的 GDPR 权利',
      bullets: [
        '在适用条件下，你可请求访问副本、更正、删除、限制处理和数据可携带；也可反对基于合法利益的处理。',
        '你可直接使用“账号与数据”页面删除当前账号，或通过 Contact 提交其他请求。为保护他人，我们可能要求合理验证账号或记录所有权；匿名会话丢失后，可完成的验证可能有限。',
        '如你认为未来发布的群聊整理问答与你有关、不准确或仍可识别你，可通过 Contact 请求说明来源、更正或删除。我们会按适用法律和实际可验证情况处理，不会要求你在公开页面披露身份。',
        '适用 GDPR 时，我们通常会在收到有效请求后一个月内答复；复杂或大量请求可依法延长，并会说明原因。',
        '你有权向常住地、工作地或涉嫌侵权地的数据保护监管机构投诉。提出请求或投诉不会降低你获得服务的权利。',
      ],
    },
    {
      title: '8. 安全、变更与联系',
      paragraphs: [
        '我们采用 HTTPS、最小权限、数据库行级权限、私有反馈收件箱、受控备份和日志轮换等措施降低风险。若处理方式、接收者或目的发生实质变化，我们会在生效前更新本页日期和内容。任何隐私或数据问题均请通过 Contact 页面提交。',
      ],
    },
  ],
  relatedLabel: '同时阅读',
  relatedHref: '/terms',
  relatedText: 'RunIPS 条款与条件',
  referenceLabel: '官方参考',
  references: [
    { label: '欧盟 GDPR 正文', href: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng' },
    { label: '欧盟委员会：GDPR 数据处理原则', href: 'https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en' },
    { label: '欧盟委员会：国际数据传输规则', href: 'https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/rules-international-data-transfers_en' },
    { label: 'Tencent Cloud International：数据处理与安全协议', href: 'https://intl.cloud.tencent.com/document/product/301/17347?lang=en' },
    { label: 'SerpApi：Google Flights API', href: 'https://serpapi.com/google-flights-api' },
    { label: 'SerpApi：Search Archive API', href: 'https://serpapi.com/search-archive-api' },
    { label: 'SerpApi：法律文件与隐私政策', href: 'https://serpapi.com/legal' },
  ],
};

const zhTerms: LegalDocumentContent = {
  eyebrow: 'RUNIPS / TERMS',
  title: '条款与条件',
  summary: '这些条款用于保护分享真实经历的学生、参与交流中心的用户、被评价者和其他受影响人员。使用账号功能或提交内容，即表示你接受本条款并确认已阅读隐私保护说明。',
  updatedLabel: '生效及最后更新',
  updatedAt: '2026 年 8 月 26 日',
  sections: [
    {
      title: '1. 服务性质与资格',
      bullets: [
        'RunIPS 是面向早稻田大学 IPS 学生的非官方、非商业学生指南，目前提供研究导师与研究室评价、交流中心，以及搜索抵达 FUK 或 KKJ 航班的旅行指南。它不代表早稻田大学；课程评价与机场到学校交通是未来的独立功能。',
        '你须年满 18 岁，并具有接受这些条款的法律能力。导师评价须来自本人对该导师或研究室的第一手研究经历；交流中心投稿应是你有权分享的问题、经验或资料。',
        '本站信息仅用于参考，不是学校决定、专业建议或事实裁判。',
      ],
    },
    {
      title: '2. 账号与可接受使用',
      bullets: [
        '每个账号对每位导师只能保留一条评价。不得代替他人提交、操纵评分或投票、制造重复主题、恶意举报，或创建多个账号规避限制。',
        '你应保护当前会话。清除浏览器数据或遗失匿名会话可能导致无法继续编辑；仍能访问账号时可随时自助删除。',
        '不得探测或绕过访问控制、自动化滥用接口、抓取非公开数据、干扰服务、传播恶意代码，或尝试识别匿名评价者。',
      ],
    },
    {
      title: '3. 投稿规则',
      bullets: [
        '导师评价应聚焦研究指导、沟通反馈、自主度、实验室文化、资源支持和本人真实感受，并尽量描述可观察的行为或模式。',
        '交流中心投稿应使用清晰标题和合适分类，发布前查看相似主题，并尽可能提供准确、相关且可验证的信息。不得把主题或回复用作私信。',
        '不得提交虚假或误导内容、未经证实的严重指控、人身攻击、威胁、骚扰、仇恨或歧视内容、外貌评价、违法内容、广告或垃圾信息。',
        '不得披露自己或他人的姓名、学号、联系方式、健康信息、精确行程、未公开研究、账号凭证、第三方机密信息或私人聊天原文。除非你有权提交且不侵害他人权利，否则不得复制群聊、邮件或私信。',
        '如未来启用群聊知识整理，RunIPS 只会从私有短期暂存中发布经去识别化改写且人工复核的问答，不会发布原聊天或发送者标识。具体处理将在启用前按《隐私保护说明》公开；本条不表示该功能已经提供。',
        '三个背景项需要主动选择，并可选择“不公开”。文字评论完全可选，可为 0–2000 字。',
      ],
    },
    {
      title: '4. 内容权利与许可',
      paragraphs: [
        '你保留原创内容的权利。你向 RunIPS 授予一项全球、非独占、免版税的许可，并仅允许为运行服务所必需的处理者转许可，用于托管、复制、格式化、翻译、公开展示、备份和审核投稿。许可只用于提供、保护和改进 RunIPS；内容删除后即终止，但受控备份轮换和不可排除的法律义务所需范围除外。你保证有权提交该内容。',
      ],
    },
    {
      title: '5. 审核、举报与内容请求',
      paragraphs: [
        '我们可以但没有义务预先审查。为执行规则、保护隐私、处理举报或降低法律与安全风险，我们可隐藏、去除敏感细节、拒绝或删除内容，限制滥用账号，或把交流中心主题标记为已解决、重复、关闭或锁定。状态标签或已采纳回复不等于 RunIPS 认定内容属实。学生、被评价者、交流中心参与者或第三方可通过页面举报功能或 Contact 提交内容问题；我们会结合第一手经历、公共利益、隐私和表达权进行复核，但不保证每项决定都不会出错。',
      ],
    },
    {
      title: '6. 隐私、删除与终止',
      bullets: [
        '公开评价不显示内部账号信息；交流中心主题与回复则是公开内容。任何公开匿名都并非绝对不可识别。数据处理、GDPR 合法基础、跨境存储、保留期和权利见《隐私保护说明》。',
        '你可在“账号与数据”页面永久删除账号和所有线上关联个人数据。你的交流中心投稿会移除用户内容和作者关联；如其他用户的回复需要维持讨论结构，可能保留一个不含你的内容或身份的删除占位符。删除不可撤销，备份残留会在最多 14 天内轮换消失。',
        '你可停止使用服务。我们也可为安全、违法、严重或重复违规暂停或终止账号；适用法律要求时会提供理由和可行的申诉渠道。数据保护权利不因账号终止而消失。',
      ],
    },
    {
      title: '7. 可用性、第三方链接与责任',
      paragraphs: [
        '评价是投稿者的主观经历，交流中心主题和回复由参与者提供，都不代表 RunIPS 的事实认定。我们不保证内容完整、准确或持续可用，也不应将本服务作为选择导师、办理行政事项或处理学业纠纷的唯一依据。Google Scholar 等第三方链接适用其自身条款。',
        '旅行指南中的航班、时刻、余位和价格是 SerpApi 从 Google Flights 返回的索引结果，不是 RunIPS、Google、SerpApi 或航司作出的报价、预订或可用性保证。信息可能随时变化；付款前应在航司或售票渠道核实。Google Flights 与 ITA Matrix 是外部服务，ITA Matrix 不直接售票；其条款与隐私政策分别适用。转机证件模块只是筛查提示，不构成移民、签证或法律建议。',
        '在适用法律允许的最大范围内，RunIPS 按现状提供，不对无法合理预见的间接损失负责。本条不排除欺诈、故意不当行为、重大过失、死亡或人身伤害，亦不限制法律不得排除的消费者、数据保护或其他权利。',
      ],
    },
    {
      title: '8. 条款变更、适用法律与联系',
      paragraphs: [
        '如条款发生实质变化，我们会更新日期并在变更生效前提供合理提示；变更不追溯剥夺已经产生的权利。除强制性消费者或数据保护规则另有规定外，本条款受日本法律管辖，争议由具有合法管辖权的法院处理。规则、删帖、隐私或其他问题请通过 Contact 页面提交。',
      ],
    },
  ],
  relatedLabel: '同时阅读',
  relatedHref: '/privacy',
  relatedText: 'RunIPS 隐私保护说明',
};

const enPrivacy: LegalDocumentContent = {
  eyebrow: 'RUNIPS / PRIVACY',
  title: 'Privacy Notice',
  summary: 'This notice follows the transparency principles of the EU General Data Protection Regulation (GDPR). It explains what RunIPS processes, why, where and for how long, and how you can exercise your data rights. Public anonymity does not mean that the service processes no internal data or that nobody could ever infer a contributor’s identity.',
  updatedLabel: 'Effective and last updated',
  updatedAt: '26 August 2026',
  sections: [
    {
      title: '1. Controller and scope',
      paragraphs: [
        'The controller is the RunIPS project operator, an independent, non-commercial student project. RunIPS is not affiliated with, endorsed by, or speaking for Waseda University. Contact the controller through the in-site Contact page; privacy, access, correction, export, objection, restriction, and erasure requests can all be submitted there.',
        'RunIPS uses the core GDPR requirements as its data-protection baseline for every user and applies the mandatory requirements where the GDPR legally governs a user or processing activity. This notice is not a claim of government certification or absolute compliance status.',
      ],
    },
    {
      title: '2. Data we process',
      bullets: [
        'Account and authentication data: a random internal ID, identities, sessions, and sign-in times for anonymous accounts. If Google sign-in is enabled later and you actively choose it, this also includes basic authentication details such as email address and display name.',
        'Contribution data: supervisor ratings, research pressure, six supervision ratings, choose-again answer, tags, written comment, student level, relationship, primary communication language, and posting and editing times. You must actively choose each context field, including the available “Not disclosed” choice; a written comment may contain 0–2,000 characters.',
        'Community contribution data: topic type, title, body, category, tags, replies, quotation links, status, accepted reply, duplicate-topic link, the author’s internal account link, and posting, editing, and last-activity times.',
        'Interaction and contact data: review votes, topic subscriptions, in-site notifications, content reports, Contact submissions, optional reply details, handling status, and relevant timestamps.',
        'Operational and security data: IP address, request path without the query string, browser or device information, request time, errors, and security events. Language preference and sign-in sessions are also stored in your browser.',
        'Travel Guide query data: when you actively search, RunIPS processes the origin airport, FUK or KKJ destination, departure date, fixed economy-cabin setting, and query time. Passport country, ticket arrangement, and baggage plan are used only in the browser to generate the transfer screen; they are not sent to the flight-search interface or linked to an account.',
        'RunIPS does not ask for special-category data. Do not include your own or another person’s health, political, religious, biometric, sexual-life, exact-movement, student-number, contact, unpublished-research, private-chat, or other private or sensitive information in a review, topic, or reply.',
      ],
    },
    {
      title: '3. Purposes and GDPR lawful bases',
      bullets: [
        'Performance of our service agreement (Article 6(1)(b)): creating and maintaining the account you request; storing, publishing, and letting you manage your reviews, Community topics, and replies; and automatically following a topic and generating in-site notifications when you create that topic or post a reply. You can unfollow at any time on the topic page. We cannot provide these functions without an account and the necessary contribution data. Specific review-context values and a written review are not required.',
        'Legitimate interests (Article 6(1)(f)): moderating and managing public content, linking duplicate topics, preventing duplicate submissions and abuse, investigating security incidents, maintaining backups, diagnosing faults, handling feedback, and improving a non-commercial student guide. We consider necessity and the rights of contributors, repliers, reviewed people, and others affected before relying on these interests; you may object through Contact.',
        'Legal obligation (Article 6(1)(c)): retaining or disclosing the minimum necessary records when applicable law requires it, responding to valid legal process, and meeting data-protection or security duties.',
        'Steps at your request (Article 6(1)(b)) or legitimate interests (Article 6(1)(f)): responding to a Contact request you choose to make. Optional reply details are used only for that request.',
        'Performance of the travel search you request (Article 6(1)(b)): submitting the minimum route, date, and cabin criteria to the flight-search service and returning same-day flights, connection patterns, and indicative prices. RunIPS cannot provide live search without these query fields; passport, ticket, and baggage answers are not necessary for that search.',
        'If RunIPS later considers processing records from a WeChat group or another source that did not provide the data directly to us, we will determine and document the applicable lawful basis before processing begins, assess necessity and rights, and provide the transparency information required by GDPR Article 14 where applicable. This notice does not mean that an import feature is already enabled.',
      ],
    },
    {
      title: '4. Public display, anonymity limits, and automation',
      bullets: [
        'A public review may show ratings, the choose-again answer, tags, posting time, context you actively disclose, and a voluntary comment. The public view omits your name, email address, account ID, and internal user ID.',
        'Community topic titles, bodies, categories, tags, statuses, replies, and timestamps are public worldwide and may be read, linked to, or copied. The public view omits internal account IDs. Subscriptions and in-site notifications are visible only to the relevant account and authorised operators.',
        'A small number of authorised RunIPS operators may access internal records for operations, backups, security investigations, moderation, reports, or rights requests. Contact submissions go only to a private inbox.',
        'A distinctive event, date, research topic, or writing style may still let someone familiar with the situation infer a contributor or third party. Omit identifying detail and do not use Community as a private communication channel. No online service can promise absolute security or impossible re-identification.',
        'If a group-chat knowledge project is introduced later, raw records may be held only in restricted private staging for a documented short human-review period. Publication will be limited to anonymised, rewritten Q&A that has passed human review, never raw chat, sender identifiers, or unrelated personal information. If a rewritten item still presents a re-identification risk, we will continue to treat it as personal data.',
        'RunIPS does not sell personal data, use advertising profiles or third-party behavioural analytics, or make automated decisions with legal or similarly significant effects.',
      ],
    },
    {
      title: '5. Recipients, location, and international transfers',
      paragraphs: [
        'The application, PostgreSQL database, and authentication service are self-hosted on Tencent Cloud International infrastructure in Singapore. The relevant infrastructure operator may process data as a processor only as needed for computing, networking, security, and support. Anonymous supervisor reviews and Community topics and replies are made available to the public worldwide.',
        'Live Travel Guide searches use SerpApi, LLC in the United States. The RunIPS backend sends only origin, FUK or KKJ, date, economy setting, and RunIPS’s own API credential; it does not forward the browser IP address, account ID, passport, ticket, or baggage answers. SerpApi queries Google Flights on RunIPS’s behalf and states that search parameters and results may remain retrievable through its Search Archive for up to 31 days. After you open a Google Flights or ITA Matrix link, your browser contacts that third party directly under its own terms and privacy policy.',
        'Singapore is outside the European Economic Area. For transfers governed by GDPR Chapter V, Tencent Cloud International’s current Data Processing and Security Agreement incorporates, where applicable, the European Commission’s 2021/914 controller-to-processor Standard Contractual Clauses (SCCs, Module 2), with security measures and subprocessor arrangements. The agreement is linked in the official references below. If another processor is added, we will establish an applicable transfer mechanism first and update this notice.',
        'The outbound flight query is designed to be data-minimised, contain no direct identifier, and remain unlinked to a RunIPS account. If a query nevertheless constitutes personal data in its particular context and GDPR Chapter V applies, RunIPS will stop that personal-data transfer unless an applicable transfer safeguard is in place; a provider’s general security or compliance claim does not replace a required legal mechanism.',
      ],
    },
    {
      title: '6. Retention and account erasure',
      bullets: [
        'Accounts, supervisor reviews, Community topics and replies, votes, and reports remain until you delete the account, separately delete content, or they are no longer needed to provide the service, except for the minimum required by a valid legal obligation. Creating a topic or posting a reply automatically follows that topic. The follow record remains until you unfollow on the topic page, the topic is deleted, or you delete the account; a notification remains only while needed to provide and manage that feature.',
        'Contact submissions remain until the request and reasonable follow-up are complete. We review necessity periodically and delete or de-identify submissions that are no longer needed.',
        'If a group-chat knowledge project is introduced later, raw files and unpublished candidates will remain in private staging only for a documented short period needed for human review. Raw files will be deleted when that batch is completed or abandoned. The actual review period and processing detail will be published before processing begins.',
        'Application access logs are retained for no more than 14 days. Minimum records isolated for an active security investigation or legal duty remain only until that purpose is complete.',
        'Travel Guide results are cached in server memory for no more than 10 minutes, are not written to the RunIPS database, and disappear when the service restarts. A cache key contains only airports, date, currency, and cabin—not an IP address, account, or passport. SerpApi states that a completed search may remain retrievable through its Search Archive for up to 31 days; its own policy governs that retention.',
        'The database is backed up daily with a rolling retention of no more than 14 days. Live deletion is immediate. Residual backup copies expire through rotation and are not used to restore a deleted account or republish content.',
        'A signed-in user can submit the self-service form on the Account and data page. Erasure removes the authentication account, identities, sessions, reviews, review votes, Community subscriptions, notifications and reports, still-linked Contact submissions, and authentication audit entries identifiable by account ID. For your Community topics and replies, it removes the author link and user-supplied title, body, and other content. If a record must remain to preserve another person’s reply structure, it becomes a “deleted” placeholder with no user content, author identity, or internal account ID. Topic or reply record numbers and timestamps may remain where needed to preserve thread references.',
      ],
    },
    {
      title: '7. Your GDPR rights',
      bullets: [
        'Where the relevant conditions apply, you may request access and a copy, rectification, erasure, restriction, and portability. You may also object to processing based on legitimate interests.',
        'Delete the current account directly on the Account and data page or use Contact for another request. To protect others, we may reasonably verify the account or record ownership. Verification may be limited after an anonymous session is lost.',
        'If you believe that a Q&A item derived from a future group-chat project concerns you, is inaccurate, or can still identify you, use Contact to request source information, correction, or erasure. We will handle the request under applicable law and reasonably available verification without requiring you to identify yourself on a public page.',
        'Where GDPR applies, we ordinarily respond to a valid request within one month. A lawful extension may apply to complex or numerous requests, in which case we will explain why.',
        'You may complain to the data-protection authority where you habitually live or work, or where the alleged infringement occurred. Making a request or complaint will not reduce your service rights.',
      ],
    },
    {
      title: '8. Security, changes, and contact',
      paragraphs: [
        'We use HTTPS, least privilege, row-level database permissions, a private feedback inbox, controlled backups, and log rotation to reduce risk. If recipients, purposes, or other practices materially change, we will update this page and its effective date before the change takes effect. Use the Contact page for any privacy or data question.',
      ],
    },
  ],
  relatedLabel: 'Also read',
  relatedHref: '/terms',
  relatedText: 'RunIPS Terms and Conditions',
  referenceLabel: 'Official references',
  references: [
    { label: 'EU General Data Protection Regulation', href: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng' },
    { label: 'European Commission: GDPR data-processing principles', href: 'https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en' },
    { label: 'European Commission: international data-transfer rules', href: 'https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/rules-international-data-transfers_en' },
    { label: 'Tencent Cloud International: Data Processing and Security Agreement', href: 'https://intl.cloud.tencent.com/document/product/301/17347?lang=en' },
    { label: 'SerpApi: Google Flights API', href: 'https://serpapi.com/google-flights-api' },
    { label: 'SerpApi: Search Archive API', href: 'https://serpapi.com/search-archive-api' },
    { label: 'SerpApi: legal documents and privacy policy', href: 'https://serpapi.com/legal' },
  ],
};

const enTerms: LegalDocumentContent = {
  eyebrow: 'RUNIPS / TERMS',
  title: 'Terms and Conditions',
  summary: 'These terms protect students who share genuine experience, Community participants, people being reviewed, and others affected by public content. By using an account feature or submitting content, you accept these terms and acknowledge the Privacy Notice.',
  updatedLabel: 'Effective and last updated',
  updatedAt: '26 August 2026',
  sections: [
    {
      title: '1. Service and eligibility',
      bullets: [
        'RunIPS is an unofficial, non-commercial guide for Waseda University IPS students. It currently provides research-supervisor and laboratory reviews, a Community, and a Travel Guide that searches flights into FUK or KKJ. It does not represent Waseda University; course reviews and airport-to-campus transport are separate future features.',
        'You must be at least 18 and legally able to accept these terms. A supervisor review must come from your own first-hand research experience with the supervisor or laboratory. A Community contribution must be a question, experience, or material that you have the right to share.',
        'The site is for information only. It is not a university decision, professional advice, or a factual adjudication.',
      ],
    },
    {
      title: '2. Accounts and acceptable use',
      bullets: [
        'Each account may keep one review per supervisor. Do not submit for another person, manipulate ratings or votes, manufacture duplicate topics, report maliciously, or create accounts to evade a restriction.',
        'Protect your session. Clearing browser data or losing an anonymous session may remove your ability to edit. You can erase the account while you can still access it.',
        'Do not probe or bypass access controls, abuse an API through automation, extract non-public data, disrupt the service, distribute malicious code, or try to identify an anonymous reviewer.',
      ],
    },
    {
      title: '3. Contribution rules',
      bullets: [
        'A supervisor review must focus on supervision, feedback, research autonomy, laboratory culture, available support, and your genuine experience. Prefer observable conduct or patterns.',
        'A Community contribution must use a clear title and suitable category. Check similar topics before posting and provide information that is as accurate, relevant, and verifiable as reasonably possible. Do not use a topic or reply as a private message.',
        'Do not submit false or misleading material, unverified serious allegations, personal attacks, threats, harassment, hateful or discriminatory content, appearance comments, unlawful material, advertising, or spam.',
        'Do not disclose your own or another person’s name, student number, contact details, health data, exact movements, unpublished research, account credentials, confidential information, or private-chat text. Do not copy a group chat, email, or direct message unless you have the right to submit it and doing so does not infringe another person’s rights.',
        'If a group-chat knowledge project is introduced later, RunIPS will publish only anonymised, rewritten Q&A that has passed human review after restricted, short-term private staging, never raw chat or sender identifiers. The processing detail will be published in the Privacy Notice before launch; this term does not mean that the feature is already available.',
        'Each context field requires an active choice, including “Not disclosed”. A written comment is entirely optional and may contain 0–2,000 characters.',
      ],
    },
    {
      title: '4. Content rights and licence',
      paragraphs: [
        'You retain rights in your original content. You grant RunIPS a worldwide, non-exclusive, royalty-free licence, sublicensable only to processors needed to operate the service, to host, copy, format, translate, publicly display, back up, and moderate your contribution. The licence is limited to providing, securing, and improving RunIPS. It ends when the content is deleted, except to the extent needed for controlled backup rotation or a non-excludable legal duty. You warrant that you have the right to submit the content.',
      ],
    },
    {
      title: '5. Moderation, reports, and content requests',
      paragraphs: [
        'We may, but need not, review content before publication. To enforce these rules, protect privacy, handle a report, or reduce legal and security risk, we may hide content, redact sensitive detail, reject or remove a contribution, restrict an abusive account, or mark a Community topic resolved, duplicate, closed, or locked. A status or accepted reply is not a factual endorsement by RunIPS. A student, reviewed person, Community participant, or third party may use the page-reporting feature or Contact to raise a content concern. We consider first-hand experience, public interest, privacy, and expression, but cannot promise that every decision will be error-free.',
      ],
    },
    {
      title: '6. Privacy, erasure, and termination',
      bullets: [
        'Public reviews omit internal account details; Community topics and replies are public content. Public anonymity is not a promise that identification is impossible. See the Privacy Notice for processing, GDPR lawful bases, international hosting, retention, and rights.',
        'You can permanently erase the account and all linked live personal data on the Account and data page. Your Community contributions lose their user content and author link. Where another user’s reply requires the thread structure to remain, a deleted placeholder with none of your content or identity may remain. Erasure cannot be undone; residual backups expire within the 14-day rotation.',
        'You may stop using the service. We may suspend or terminate an account for security, illegality, or serious or repeated breach, with reasons and a practicable appeal route where applicable law requires them. Data-protection rights survive termination.',
      ],
    },
    {
      title: '7. Availability, third-party links, and liability',
      paragraphs: [
        'Reviews are contributors’ subjective experiences, while Community topics and replies are supplied by participants; neither is a factual finding by RunIPS. We do not guarantee completeness, accuracy, or continuous availability. Do not use RunIPS as the sole basis for choosing a supervisor, completing an administrative process, or resolving an academic dispute. Third-party links, including Google Scholar, are governed by their own terms.',
        'Travel Guide flights, times, availability, and prices are indexed results returned by SerpApi from Google Flights; they are not a quote, reservation, or availability guarantee by RunIPS, Google, SerpApi, or an airline. Details can change at any time and must be checked with the airline or ticket seller before payment. Google Flights and ITA Matrix are external services, and ITA Matrix does not sell tickets; their respective terms and privacy policies apply. The transit-document module is a screening prompt, not immigration, visa, or legal advice.',
        'To the fullest extent permitted by applicable law, RunIPS is provided as is and is not responsible for indirect loss that was not reasonably foreseeable. Nothing here excludes fraud, wilful misconduct, gross negligence, death or personal injury, or any consumer, data-protection, or other right that the law does not allow us to exclude.',
      ],
    },
    {
      title: '8. Changes, governing law, and contact',
      paragraphs: [
        'For a material change, we will update the date and give reasonable notice before the new terms take effect. A change will not retrospectively remove accrued rights. Subject to mandatory consumer and data-protection rules, these terms are governed by Japanese law and disputes go to a court with lawful jurisdiction. Use Contact for rules, removal, privacy, or any other concern.',
      ],
    },
  ],
  relatedLabel: 'Also read',
  relatedHref: '/privacy',
  relatedText: 'RunIPS Privacy Notice',
};

export const LEGAL_DOCUMENTS: Record<Lang, Record<LegalDocumentKind, LegalDocumentContent>> = {
  zh: { privacy: zhPrivacy, terms: zhTerms },
  en: { privacy: enPrivacy, terms: enTerms },
};
