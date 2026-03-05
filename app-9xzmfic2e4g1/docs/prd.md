# Cappadocia AI Travel Planner 需求文档

## 1. 应用概述

### 1.1 应用名称
Cappadocia AI Travel Planner

### 1.2 应用描述
一款专为卡帕多西亚（土耳其内夫谢希尔地区）设计的企业级 AI 驱动旅行规划系统。系统使用 OpenAI 生成个性化行程，并通过 Google Maps APIs 验证所有地点，确保准确性和可靠性。应用提供媲美 Wanderlog 的高端、情感化用户体验，具备精致的视觉设计、流畅的动画和直观的交互。

## 2. 核心功能

### 2.1 行程规划
- 基于步骤的向导表单，带实时预览地图
- 步骤 1：日期选择
- 步骤 2：兴趣偏好
- 步骤 3：旅行风格和节奏
- AI 根据用户输入生成行程建议
- 所有建议地点通过 Google Places API 验证
- 未验证的地点自动丢弃
- 最终行程显示已验证地点及完整详情

### 2.2 行程管理
- 查看详细的每日时间线，采用高端卡片设计
- 拖放重新排序每日地点
- 重新排序后自动重新计算路线
- 显示每日总距离、时长和预估预算
- 地点之间的旅行时间块，显示驾驶时长
- 本地保存多个行程
- 删除已保存行程

### 2.3 交互式地图
- 粘性地图视图与时间线同步（30% 宽度）
- 将所有地点显示为自定义 SVG 标记
- 显示地点之间的路线折线
- 活动标记弹跳动画
- 点击时间线项目以居中地图并高亮标记
- InfoWindow 显示地点图片、评分和在 Google Maps 中打开按钮
- 平滑地图过渡

### 2.4 地点信息
- 大型 16:9 图片为主的卡片布局
- Google 验证的地点名称和地址
- 评分显示为徽章
- AI 生成的描述
- 预估访问时长
- 每个活动的时间段，图片上带徽章叠加
- 悬停效果带高度和柔和阴影动画

### 2.5 AI 探索
- 动态卡帕多西亚探索建议
- 基于兴趣的推荐
- 实时 AI 驱动内容生成

### 2.6 账户管理
- 查看所有已保存行程
- 访问行程历史
- 管理已保存行程
- 个人资料管理
- 偏好设置
- 隐私和安全控制

### 2.7 认证系统
- 电子邮件和密码登录
- Google OAuth 登录（OSS Google 登录方式）
- 记住我功能
- 密码重置流程
- 双因素认证支持
- 跨设备会话管理

## 3. 技术架构

### 3.1 系统流程
1. 用户通过基于步骤的向导提交行程表单
2. OpenAI 生成仅包含地点名称的行程
3. 对于每个建议地点：
   - 查询 Google Places Text Search API
   - 解析 place_id
   - 获取地点详情
   - 检索照片和评分
4. 用已验证的 Google 数据替换 AI 建议
5. 构建最终行程结构
6. 使用 Google Directions API 计算路线
7. 渲染带动画的时间线和地图
8. 将行程存储在 localStorage 中

### 3.2 核心架构规则
- 无内部 POI 数据库
- OpenAI 仅作为建议引擎
- Google APIs 作为地点真实性引擎
- 所有地点必须经过 Google 验证后才能渲染
- 无法验证的地点将被丢弃

### 3.3 服务层结构
- openaiService.ts：AI 行程生成
- googleVerificationService.ts：地点验证和解析
- googlePhotoService.ts：照片 URL 生成
- directionsService.ts：路线计算
- itineraryBuilder.ts：合并 AI 和 Google 数据
- itineraryValidator.ts：验证和去重

### 3.4 状态管理
- Zustand store 用于行程状态
- localStorage 用于持久化
- 基于 UUID 的行程标识

### 3.5 API 集成

#### OpenAI API
- 系统提示强制仅限卡帕多西亚建议
- Temperature：0.3 以保持一致性
- 仅返回地点名称和类别（无坐标）
- JSON 验证带重试逻辑
- 允许的区域：Göreme、Uçhisar、Ürgüp、Avanos、Ortahisar、Çavuşin、Derinkuyu、Kaymaklı

#### Google Maps JavaScript API
- 地图渲染和交互
- 自定义 SVG 标记放置
- InfoWindow 显示增强内容

#### Google Places API
- Text Search 用于地点解析
- Place Details 用于完整信息
- Photo references 用于图片

#### Google Directions API
- 有序地点之间的路线计算
- 折线生成
- 距离和时长计算

#### Supabase Authentication
- 用户注册和登录
- 会话管理
- 密码重置功能
- OAuth 集成（Google）

#### Supabase Database - 缓存表
- places_cache：存储已验证的 Google Places 数据
- directions_cache：存储路线计算结果

#### Supabase Storage
- place-photos：存储地点照片二进制数据的公共存储桶

### 3.6 领域特定规则
- 热气球之旅安排在日出时分（约 05:00）
- 日落山谷访问在 17:30 之后
- 每天最多 5 个地点
- 行程中无重复地点
- 跨天的地理分布
- 基于兴趣的包含项：
  - 热气球 → 第 1 天日出
  - 美食 → 传统餐厅
  - 骑马 → Rose Valley 或 Love Valley
  - ATV → Love Valley 或 Sword Valley
  - 地下城市 → Derinkuyu 或 Kaymaklı（仅一个）

## 4. 页面结构

### 4.1 落地页（/）

#### 目标文件
- 文件：src/pages/LandingPage.tsx
- 章节：Hero + Features + How It Works + Testimonials + CTA + Footer
- 样式：Tailwind CSS + 自定义渐变

#### 章节 1：Hero 部分

**背景：**
- 基础：卡帕多西亚热气球高分辨率照片
- 叠加：径向渐变（中心透明 → 边缘深色）
- 模糊：backdrop-blur-sm
- 视频替代：卡帕多西亚 15 秒 B-roll（自动播放、静音、循环）

**布局：**
- 全视口高度（100vh）
- Flex 居中
- 最大宽度：1200px
- 内边距：48px

**内容：**

1. 眉标文本：🎈 Yapay Zeka Destekli Seyahat Planlayıcı
   - 大小：14px
   - 粗细：500
   - 颜色：白色/强调色
   - 背景：rgba(white, 0.1)，圆角全，px-4 py-2

2. 主标题：
   - 文本：Kappadokya'da Her Anınızı Kıymetli Yapın
   - 大小：64px（桌面）/ 40px（移动）
   - 粗细：700
   - 颜色：白色
   - 行高：1.2
   - 最大宽度：800px

3. 副标题：
   - 文本：Yapay zekamız kişisel tercihlerinize göre mükemmel Kappadokya itinerarısı oluşturur. Balonlar, müzeler, gizli vadiler... Hepsi elinizin altında.
   - 大小：20px（桌面）/ 16px（移动）
   - 粗细：400
   - 颜色：rgba(white, 0.9)
   - 最大宽度：700px
   - 行高：1.6

4. CTA 按钮（2 个并排）：
   - 主要：Planlamaya Başla（大小：18px，内边距：16px 32px）
     * 背景：线性渐变（#3B82F6 → #2563EB）
     * 悬停：亮度增加 10%，shadow-2xl
     * 箭头图标：右侧
   
   - 次要：Nasıl Çalışır?（透明按钮）
     * 边框：2px 白色
     * 文本：白色
     * 悬停：背景 white/10

5. 信任徽章（按钮下方）：
   - ⭐ 4.9 Yıldız | 👥 2.5K+ Gezgin | 🗺️ 50+ Rota
   - 间距：24px 水平
   - 字体：14px，半粗体

#### 章节 2：功能

**布局：**
- 3 列网格（移动：1，平板：2）
- 间隙：32px
- 内边距：80px 水平，60px 垂直
- 背景：白色

**功能（共 6 个）：**

1. 功能：AI-Powered Itineraries
   - 图标：Sparkles（大，48px，#3B82F6）
   - 标题：Zeki Rota Oluşturma
   - 描述：OpenAI tarafından desteklenen yapay zeka, 1000+ Kappadokya noktasını analiz ederek sizin için özel rotalar hazırlar.
   - 强调：图标后面的柔和蓝色背景圆圈

2. 功能：Real-Time Map
   - 图标：MapPin（48px，#EC4899）
   - 标题：Canlı Harita & Navigasyon
   - 描述：Google Maps entegrasyonu ile tüm mekanları harita üzerinde görün, mesafeleri hesaplayın ve sıralamayı değiştirin.

3. 功能：Smart Scheduling
   - 图标：Clock（48px，#10B981）
   - 标题：Akıllı Zaman Planlama
   - 描述：Günlük tempo tercihlerinize göre, her mekanın ziyaret saati otomatik olarak belirlenir.

4. 功能：Drag & Drop
   - 图标：GripVertical（48px，#F59E0B）
   - 标题：Kolay Düzenle
   - 描述：Sürükle-bırak yöntemiyle itinerary'nizin sırasını değiştirin, mesafeler anında güncellenir.

5. 功能：Save & Share
   - 图标：Share2（48px，#8B5CF6）
   - 标题：Kaydet & Paylaş
   - 描述：Rotanızı hesabınıza kaydedin, arkadaşlarınızla QR kod veya link aracılığıyla paylaşın.

6. 功能：Multi-Day Support
   - 图标：Calendar（48px，#06B6D4）
   - 标题：Çok Günlü Planlar
   - 描述：1 günlük kısa turlardan 2 haftaya kadar uzun gezilere kadar, istediğiniz her duruma rota oluşturun.

**卡片设计：**
- 边框：1px #E5E7EB，rounded-2xl
- 内边距：32px
- 悬停：scale-105，shadow-lg，border-primary/20
- 过渡：300ms cubic-bezier(0.4, 0, 0.2, 1)

#### 章节 3：How It Works

**布局：**
- 4 步流程，移动端垂直
- 背景：线性渐变（#F3F4F6 → #E5E7EB）

**步骤（编号 1-4）：**

1. Tercihlerinizi Seçin
   - 图标：CheckCircle2
   - 描述：Tarihler, ilgiler ve tempo tercihlerinizi seçin

2. Yapay Zeka Planlar
   - 图标：Sparkles
   - 描述：Sistemimiz binlerce veri noktasını analiz eder

3. Rotanızı Görüntüleyin
   - 图标：Map
   - 描述：İnteraktif harita ve timeline'da keşfedin

4. Seyahat Edin & Tadını Çıkarın
   - 图标：Navigation
   - 描述：Rehberimizle Kappadokya'yı keşfet

**连接线：**
- 虚线，主色，垂直（移动）或水平

#### 章节 4：Testimonials / Social Proof

**布局：**
- 轮播或静态 3 列网格

**卡片：**
- 头像：48x48 圆形图片
- 姓名：16px 粗体
- 位置：14px 柔和
- 评分：⭐⭐⭐⭐⭐
- 引用：16px，斜体，最大宽度 400px
- 内边距：24px
- 边框：1px #E5E7EB
- 圆角：16px

**示例推荐：**

1. 姓名：Zeynep K. | 位置：İstanbul
   引用：Daha önce Kappadokya'ya gelmiş olsaydım, bu app'i keşfeterdim. Harika!

2. 姓名：John D. | 位置：USA
   引用：Best AI travel planner I've used. Better than Wanderlog for Cappadocia specifically.

3. 姓名：Ahmet T. | 位置：Ankara
   引用：Zaman ayırmanız gerekmeyecek. Her şey düzenli, pratik ve harika.

#### 章节 5：CTA - Call to Action

**布局：**
- 居中，全宽
- 背景：主色渐变
- 内边距：80px

**内容：**

- 标题：Rotanızı Oluşturmaya Hazır mısınız?
  * 大小：40px
  * 粗细：粗体
  * 颜色：白色

- 副标题：
  * 文本：Kappadokya'nın en güzel anlarını, yapay zeka rehberliğinde yaşayın.
  * 大小：18px
  * 颜色：rgba(white, 0.9)

- 按钮：
  * 文本：Planlamaya Başla (Ücretsiz)
  * 大小：18px
  * 内边距：16px 40px
  * 背景：白色
  * 文本颜色：主色
  * 悬停：shadow-2xl，scale-105

- 社会证明：✅ Üyelik yok, Kredi kartı gerekmez

#### 章节 6：Footer

**布局：**
- 4 列网格（移动端 1 列）
- 背景：#1F2937（深色）
- 颜色：白色
- 内边距：48px

**列：**

1. 品牌
   - Logo + 标语
   - 社交链接（图标）

2. 产品
   - Planner
   - Explore
   - My Trips

3. 公司
   - About
   - Blog
   - Contact

4. 法律
   - Privacy
   - Terms
   - Cookies

**底部栏：**
- 版权文本
- 语言选择器

#### 排版层次

**Hero：**
- H1：64px / 40px 移动，700，白色
- H2：20px，400，white/90%
- P：14px，500，white/80%

**功能：**
- 标题：24px，600，gray-900
- 描述：16px，400，gray-600

**按钮：**
- 全部：16px，600，字母间距 0.5px

#### 调色板
- 主色：#3B82F6
- 次要色：#EC4899
- 强调色 1：#10B981
- 强调色 2：#F59E0B
- 背景：#FAFAFA
- 深色：#1F2937
- 边框：#E5E7EB

#### 动画
- Hero 淡入：加载时 600ms ease-out
- 功能卡片：交错淡入（每个延迟 100ms）
- CTA 按钮：微妙脉冲动画（连续）
- 滚动显示：元素进入视口时淡入
- 推荐轮播：自动滚动（5 秒间隔）

#### 响应式断点

**移动：<640px**
- Hero 内边距：24px
- H1：40px
- 功能：1 列
- 间隙：24px

**平板：640px - 1024px**
- H1：48px
- 功能：2 列
- 内边距：32px

**桌面：>1024px**
- H1：64px
- 功能：3 列
- 内边距：48px

#### 可访问性
- 标题层次：h1 → h2 → h3（正确顺序）
- 图片 alt 文本：所有图片的描述性文本
- 颜色对比度：所有文本的 WCAG AA+
- 焦点环：所有交互元素可见
- 键盘导航：Tab 顺序逻辑
- 视频：隐藏字幕 + 文字记录

### 4.2 行程规划器（/planner）
- 现代 Wanderlog 风格的设计体验
- Hero 部分带全宽卡帕多西亚热气球背景图片和渐变叠加
- 大而醒目的标题：Hayalinizdeki Kapadokya Gezisini Planla
- 标题下方的描述性副标题
- 表单卡片采用偏移设计，出现在 hero 部分上方
- Z-index 层次：表单卡片叠加在 hero 部分上

#### 表单卡片设计
- 最大宽度：900px（桌面友好）
- 玻璃态效果：backdrop-blur 带 rgba 背景
- 柔和阴影：shadow-xl 带环效果
- 边框半径：32px（现代，圆角）
- 内边距：48px（宽敞，专业）
- 标题下方的细渐变分隔线

#### 进度指示器
- 顶部部分：3 步进度条
- 步骤 1：Tarihler（✓）
- 步骤 2：İlgiler（当前）
- 步骤 3：Tercihler（待定）
- 移动端：折叠进度指示器

#### 日期选择（日期选择器）
- 自定义日期范围选择器（Wanderlog 风格）
- 并排布局（开始/结束日期）
- 视觉反馈：
  - 焦点状态：主色光晕
  - 悬停：微妙背景变化
  - 已选择：粗体视觉指示器
- 自动计算并显示行程时长（例如，5 gün 徽章）
- 快速预设：Bu hafta、Sonraki hafta、Sonraki ay 按钮

#### 兴趣选择
- 3 列网格布局（移动端：2 列）
- 卡片：图标 + 文本 + 复选框
- 图标：Lucide-react 图标（Balloon、History、Hiking 等）
- 动画：悬停时平滑缩放（1 → 1.05）
- 已选择状态：
  - 背景：主色带 10% 不透明度
  - 边框：2px 实线主色
  - 图标颜色：主色
- 可访问性：键盘导航（Tab + Space）

#### 每日节奏选择（每日时间表）
- 水平单选组（3 个选项）
- 最小边框卡片设计带悬停效果
- 代表节奏级别的图标
- 信息工具提示：悬停时显示详细信息（例如，2-3 durak）
- 视觉差异：每个选项都有小图标

#### 附加偏好（偏好文本区域）
- 占位符带示例：Vejetaryen yemekler, çocuk dostu...
- 最小高度：120px
- 字符计数器：右下角（0/500）
- 调整大小：仅垂直
- 富文本支持：面向未来的结构（markdown-ready）

#### 提交按钮
- 全宽：是
- 高度：56px（大，触摸友好）
- 文本：图标 + 标签（Rota Oluştur 带 Sparkles 图标）
- 加载状态：
  - 旋转器 + Rotanız Hazırlanıyor...
  - 按钮禁用 + 不透明度 75%
- 悬停状态：缩放 + 阴影增加
- 活动状态：轻微缩小（0.98）

#### 调色板
- 主色：#3B82F6（蓝色，信任和宁静）
- 次要色：#EC4899（粉色，强调）
- 背景：#FAFAFA（浅灰色）
- 边框：#E5E7EB（非常浅的灰色）
- 文本：#1F2937（深灰色）
- 柔和：#9CA3AF（中灰色）

#### 排版
- 标题（H1）：32px，700 粗细，行高 1.2
- 标题（H2）：24px，600 粗细
- 正文：16px，400 粗细，行高 1.5
- 小：14px，400 粗细

#### 响应式断点
- 移动（< 640px）：单列，100% 宽度表单
- 平板（640px - 1024px）：优化的 2 列日期选择器
- 桌面（> 1024px）：带侧边栏展示的完整布局

#### 交互性
- 表单验证：实时反馈（不激进）
- 错误消息：Toast 通知（sonner）
- 成功反馈：成功提交时的庆祝动画
- 防止双重提交：API 调用期间按钮禁用

#### 可访问性
- 所有表单输入的 ARIA 标签
- 键盘导航：完全支持
- 颜色对比度：WCAG AA 标准
- 焦点可见：可预测的 tab 顺序

### 4.3 行程视图（/trip/[id]）
- 带行程名称、日期和分享按钮的标题
- 布局：时间线（70%）| 粘性地图（30%）
- 带可折叠部分的每日时间线
- 带总公里数、时长和预估预算徽章的大型日标题
- 图片为主的地点卡片（16:9 比例）带时间徽章叠加
- 卡片右上角的评分徽章
- 地点之间的旅行时间块（例如，20 分钟车程）
- 带高度和柔和阴影动画的悬停效果
- 颜色编码的天数：第 1 天（橙色强调），第 2 天（柔和琥珀色），第 3 天（柔和红色）
- 拖放重新排序
- 地图上的路线可视化

### 4.4 登录页面（/login）

#### 目标文件
- 文件：src/pages/LoginPage.tsx
- 认证：Supabase + miaoda-auth-react
- 表单：react-hook-form + zod 验证

#### 布局结构

**分割设计（桌面）：**
- 左侧（50%）：Hero 部分带品牌信息
- 右侧（50%）：登录表单

**移动端：**
- 单列（表单占全宽）

#### 左侧部分（仅桌面）

**背景：**
- 线性渐变（#3B82F6 → #1E40AF）

**内容：**
- Logo：大，居中，白色
- 标题：Kappadokya'ya Hoşgeldin
- 副标题：Yapay zeka rehberliğinde unutulmaz deneyimler yarat
- 优势列表（垂直）：
  * 🚀 AI Powered Planning
  * 🗺️ Real-time Maps
  * 💾 Save Your Plans
  * 👥 Share with Friends
- 页脚文本：Güvenlik: Verileriniz 256-bit SSL ile korunur

#### 右侧部分：登录表单

**卡片设计：**
- 背景：白色
- 边框：无
- 阴影：shadow-xl
- 边框半径：16px
- 内边距：48px（桌面）/ 32px（移动）
- 最大宽度：420px

**表单部分：**

1. 标题：
   - 标题：Giriş Yap
   - 副文本：Rotanızı yönetin ve seyahatinizi planlayın

2. 电子邮件输入：
   - 标签：E-posta
   - 类型：email
   - 占位符：name@example.com
   - 验证：实时
   - 错误消息：内联，红色

3. 密码输入：
   - 标签：Şifre
   - 类型：password（切换眼睛图标）
   - 占位符：••••••••
   - 忘记密码链接：右对齐，小文本

4. 记住我（复选框）：
   - 标签：Beni hatırla
   - 默认：未选中

5. 提交按钮：
   - 全宽
   - 高度：44px
   - 文本：Giriş Yap
   - 禁用状态：API 调用期间不透明度 60%
   - 加载：显示旋转器 + Giriş yapılıyor...

6. 分隔线：VEYA

7. 社交登录按钮：
   - Google 按钮：44px 高度，全宽
   - 图标 + Google ile giriş yap
   - 悬停：微妙阴影增加
   - 实现：OSS Google 登录方式

8. 页脚：
   - Hesabınız yok mu? Kayıt ol
   - 链接颜色：主蓝色

#### 表单验证

**实时验证（onChange）：**
- 电子邮件：有效格式检查
- 密码：最少 6 个字符警告
- 显示状态：✓ 或 ✗ 图标

**错误处理：**
- 无效凭据：E-posta veya şifre hatalı
- 用户未找到：Bu e-posta ile hesap yok
- 网络错误：Bağlantı hatası. Lütfen tekrar deneyin

**成功流程：**
- 重定向到 /explore（如果没有引用者）
- 或重定向到上一页（如果存在引用者）
- 显示成功 toast：Hoşgeldin, [Name]!

#### 样式

**表单输入：**
- 高度：44px
- 内边距：0 16px
- 边框：1px #E5E7EB
- 边框半径：8px
- 焦点：蓝色边框 + 阴影
- 字体：16px（防止 iOS 缩放）

**标签：**
- 字体：14px 粗体
- 下边距：8px
- 颜色：#1F2937

**按钮：**
- 主要：蓝色背景，白色文本，44px 高度
- 次要：轮廓样式
- 禁用：不透明度 50%，无指针事件

#### 可访问性
- 表单标签：<label> 带 htmlFor
- 错误消息：aria-describedby
- Tab 顺序：逻辑流程
- 焦点可见：清晰环
- 屏幕阅读器：字段描述
- 移动端：16px 字体防止缩放

#### 响应式

**移动（<640px）：**
- 内边距：16px
- 按钮高度：48px
- 单列布局

**平板：**
- 内边距：24px

**桌面：**
- 内边距：32px
- 分割布局（50/50）

#### 动画
- 表单错误：抖动动画
- 成功 toast：滑入（300ms）
- 按钮悬停：微妙缩放

### 4.5 账户页面（/account）

#### 目标文件
- 文件：src/pages/AccountPage.tsx
- 认证：Supabase + miaoda-auth-react
- 表单：react-hook-form + zod 验证

#### 布局结构

**导航选项卡（顶部）：**
- Profile
- Trips
- Preferences
- Privacy
- Logout

**移动端：**
- 选项卡水平滚动

#### 选项卡 1：Profile

**部分：**

a) 头像和基本信息：
   - 头像：120x120px 圆形
   - 上传按钮：Profil fotoğrafını değiştir
   - 下方：全名 + 电子邮件
   - 编辑按钮：铅笔图标

b) 个人信息（编辑模式）：
   - 全名输入
   - 电子邮件输入（只读）
   - 电话输入（可选）
   - 简介文本区域（最多 200 个字符）
   - 提交 / 取消按钮

c) 账户创建：
   - 日期：Hesap oluşturulma tarihi
   - 显示：15 Ocak 2025

#### 选项卡 2：My Trips

**网格布局：**
- 3 列（桌面）/ 2 列（平板）/ 1 列（移动）

**每个行程的卡片：**
- 图片：行程中的 Hero 图片
- 标题：行程名称
- 日期：Jan 15-20, 2025
- 统计：5 days • 12 places
- 操作：
  * 编辑（铅笔图标）
  * 分享（分享图标）
  * 删除（垃圾桶图标，带确认）

**空状态：**
- 插图：手提箱
- 标题：Henüz rota yok
- CTA：İlk rotanızı oluşturun

#### 选项卡 3：Preferences

**设置列表：**

1. 电子邮件通知：
   - 复选框：Öğün önerileri
   - 复选框：Yeni özellikler
   - 复选框：İpuçları ve rehberler

2. 语言：
   - 下拉菜单：Türkçe / English
   - 自动：从浏览器检测

3. 主题：
   - 单选组：Light / Dark / System
   - 预览：小切换

4. 时间格式：
   - 单选组：24h / 12h AM/PM

5. 距离单位：
   - 单选组：km / mi

#### 选项卡 4：Privacy & Security

**部分：**

1. 密码：
   - Şifrenizi değiştir 按钮
   - 打开模态框：
     * 当前密码
     * 新密码（带强度指示器）
     * 确认密码
   - 带验证的保存按钮

2. 双因素认证：
   - 状态：Devre dışı / Etkinleştirilmiş
   - 启用按钮：打开设置模态框
   - 禁用按钮：带确认

3. 活动会话：
   - 设备名称：Chrome on Windows
   - 最后活动：2 minutes ago
   - 位置：Istanbul, Turkey
   - 注销按钮：Bu oturumu kapat

4. 数据导出：
   - 按钮：Verilerinizi indir
   - 说明：Tüm rotalarınız ve tercihleriniz

5. 删除账户：
   - 警告按钮（红色）
   - 确认模态框：Bu işlem geri alınamaz
   - 复选框：İlkini sil 以启用按钮

#### 选项卡 5：Logout

- 大型警告区域
- 按钮：Tüm oturumlardan çık
- 确认：Diğer cihazlardaki oturumlar kapatılacak

#### 样式

**表单输入：**
- 高度：44px
- 内边距：0 16px
- 边框：1px #E5E7EB
- 边框半径：8px
- 焦点：蓝色边框 + 阴影
- 字体：16px（防止 iOS 缩放）

**标签：**
- 字体：14px 粗体
- 下边距：8px
- 颜色：#1F2937

**按钮：**
- 主要：蓝色背景，白色文本，44px 高度
- 次要：轮廓样式
- 危险：红色背景
- 禁用：不透明度 50%，无指针事件

**选项卡：**
- 活动：粗体文本 + 底部边框（主色）
- 非活动：柔和文本
- 过渡：200ms

**卡片（行程列表）：**
- 边框：1px #E5E7EB
- 圆角：12px
- 悬停：Shadow-md，border primary/20
- 内边距：16px

#### 验证规则

**密码强度：**
- 最少 8 个字符
- 大写字母
- 数字
- 特殊字符
- 显示带反馈的进度条

**电子邮件：**
- 有效格式
- 唯一（如果更改）
- 验证：如果更改则发送链接

#### 可访问性

- 表单标签：<label> 带 htmlFor
- 错误消息：aria-describedby
- Tab 顺序：逻辑流程
- 焦点可见：清晰环
- 屏幕阅读器：字段描述
- 移动端：16px 字体防止缩放

#### 响应式

**移动（<640px）：**
- 内边距：16px
- 按钮高度：48px
- 卡片网格：1 列

**平板：**
- 内边距：24px
- 卡片网格：2 列

**桌面：**
- 内边距：32px
- 卡片网格：3 列

#### 性能

- 图片优化：延迟加载头像
- 表单防抖：电子邮件验证（500ms）
- 列表虚拟化：许多行程（100+）
- 代码分割：延迟加载账户页面

#### 动画

- 选项卡切换：淡入 + 滑动（200ms）
- 表单错误：抖动动画
- 成功 toast：滑入（300ms）
- 删除确认：模态框放大

### 4.6 探索页面（/explore）

#### 目标文件
- 文件：src/pages/ExplorePage.tsx
- 功能：搜索 + 过滤 + 网格画廊 + 详细视图

#### 布局结构

**1. 搜索和过滤栏**

位置：粘性（top: 0，z-index: 40）
背景：白色带阴影
内边距：20px 水平，16px 垂直

内容（3 个部分）：

a) 搜索输入：
   - 图标：搜索（左侧）
   - 占位符：Mekanları, kategorileri, keşifet...
   - 宽度：100%（移动）/ 360px（桌面）
   - 高度：44px
   - 边框半径：24px
   - 焦点：蓝色边框 + 阴影
   - 防抖：300ms

b) 过滤按钮（移动端水平滚动）：
   - 芯片：Tümü、Müzeler、Doğa、Aktiviteler、Yemek
   - 样式：最初轮廓，活动时填充
   - 间距：8px 间隙
   - 活动时平滑过渡

c) 视图切换（右侧）：
   - 网格视图：4 列（默认）
   - 列表视图：全宽
   - 图标：布局选项（lucide-react）

**2. 面包屑（如适用）：**
   - 路径：Anasayfa / Keşfet / Doğa
   - 样式：12px，柔和颜色
   - 交互式：链接工作

**3. 主内容区域**

背景：#FAFAFA
内边距：24px
最大宽度：1400px（居中）

**网格布局：**

桌面（>1024px）：
- 列：4
- 间隙：20px

平板（640px - 1024px）：
- 列：3
- 间隙：18px

移动（<640px）：
- 列：2
- 间隙：16px

**地点卡片设计：**

基本卡片：
- 纵横比：3:4（纵向）
- 边框半径：16px
- 溢出：隐藏
- 过渡：300ms 全部

部分：
a) 图片区域（70%）：
   - Object-fit：cover
   - 位置：相对
   
   叠加：
   - 徽章（右上角）：类别（白色背景，圆角全）
   - 收藏按钮（左上角）：心形图标（切换状态）
   - 评分（左下角）：⭐ 4.5（白色背景带 backdrop-blur）
   
   悬停效果：
   - 缩放：1.08
   - 叠加：渐变（透明 → dark/40%）出现
   - CTA 按钮：Detayları Gör 出现在底部

b) 内容区域（30%）：
   - 内边距：12px
   - 标题：16px 粗体，截断
   - 描述：13px，柔和，2 行夹紧
   - 间距：8px

状态：
- 默认：边框 #E5E7EB
- 悬停：Shadow-lg，border primary/30
- 活动/收藏：边框主色，星形图标填充

**4. 详细视图（模态框 / 表单）**

触发器：点击卡片

模态框结构：
- 关闭按钮：右上角（X 图标）
- 背景：渐变背景
- 宽度：90vw，最大 900px
- 高度：90vh，最大 800px
- 边框半径：24px

内容部分：
a) 图片轮播：
   - 多张高分辨率照片
   - 移动端滑动
   - 分页点
   - 全点击时灯箱

b) 标题：
   - 标题：32px 粗体
   - 评分：星星 + 计数
   - 保存按钮：轮廓样式
   - 分享按钮：图标

c) 信息部分：
   - 地址：位置图标 + 文本（可点击导航）
   - 电话：电话图标 + 文本（可点击）
   - 营业时间：时钟图标 + 文本
   - 网站：链接图标 + 链接

d) 描述：
   - 全文（如果 >200 个字符则可展开）
   - 阅读更多 / 显示更少按钮

e) 详细信息网格：
   - 时长：2 hours
   - 难度：Easy / Moderate / Hard
   - 距离：5 km from city center
   - 最佳时间：Morning / Evening

f) 底部 CTA：
   - Rotaya Ekle 按钮（主要）
   - Detayları Ziyaret Et 按钮（次要）

g) 评论部分：
   - 3-4 个示例评论
   - 姓名 + 日期 + 评分 + 文本
   - Tüm yorumları gör 链接

**5. 空状态**

无结果：
- 插图：放大镜 + 风景
- 标题：Aranan bulunamadı
- 文本：Başka bir şey deneyin
- 建议：Filtreleri sıfırla 链接

无收藏：
- 插图：心形轮廓
- 标题：Henüz favori yok
- 文本：Kalpinize gelen mekanları işaretleyin

#### 过滤逻辑

类别：
- Müzeler（博物馆）
- Doğa & Yürüyüş（自然和徒步）
- Aktiviteler（活动：热气球、ATV 等）
- Yemek & İçecek（食品和饮料）
- Altı（地下）
- Fotoğraf（摄影）

评分过滤器：
- 4.5+ ⭐
- 4.0+ ⭐
- 全部

时长过滤器：
- < 1 hour
- 1-2 hours
- 2-4 hours
- > 4 hours

#### 搜索功能

用户输入时实时：
- 防抖：300ms
- 搜索字段：名称、描述、类别
- 高亮匹配项
- 建议下拉菜单（前 5 个结果）

#### 排序选项

下拉菜单：
- 相关性（默认）
- 评分（从高到低）
- 受欢迎程度
- 距离（最近优先）
- 最新添加

#### 数据结构
```typescript
interface Place {
  id: string
  name: string
  description: string
  category: string
  rating: number
  user_ratings_total: number
  images: string[]
  address: string
  phone?: string
  hours?: string
  duration: number
  difficulty: Easy | Moderate | Hard
  distance_from_center: number
  best_time: Morning | Afternoon | Evening | Any
  reviews: Review[]
}

interface Review {
  author: string
  date: string
  rating: number
  text: string
  avatar?: string
}
```

#### 样式

卡片：
- 边框：1px #E5E7EB，rounded-2xl
- 过渡：transform 300ms，shadow 300ms
- 悬停：transform-gpu（更好的性能）
- 阴影：shadow-md → shadow-xl 悬停时

模态框：
- 背景：实心 #000 带 50% 不透明度
- 动画：淡入 + 放大（200ms）
- 拖动：通过背景点击可关闭

#### 交互元素

收藏按钮：
- 未填充：轮廓心形图标
- 填充：实心心形（主色）
- 动画：切换时缩放脉冲
- 持久化：localStorage（临时）+ DB（如果已登录）

分享按钮：
- 选项：复制链接、通过 WhatsApp 分享、电子邮件、二维码
- 弹出窗口：位于按钮附近
- 复制反馈：Toast 通知

添加到行程按钮：
- 模态框：如果已认证则选择天数
- 未认证：重定向到登录

#### 可访问性

- 图片 alt 文本：描述性
- 标题：页面标题为 h1，部分标题为 h2
- 按钮：清晰标签（不仅仅是图标）
- 键盘：通过卡片的 Tab 导航
- 焦点可见：焦点时可见环
- 模态框：焦点陷阱，Escape 关闭
- ARIA：role=dialog，aria-labelledby 等

#### 性能

- 图片：延迟加载
- 网格：100+ 项的虚拟滚动
- 搜索：防抖
- 过滤器：实时预览（无页面重新加载）
- 模态框：代码分割（按需加载）

#### 动画

- 卡片悬停：平滑缩放 + 阴影
- 模态框打开：淡入 + 缩放（200ms cubic-bezier）
- 过滤器过渡：不透明度变化
- 滚动显示：卡片出现时淡入
- 加载状态：带脉冲动画的骨架卡片

### 4.7 导航栏组件

#### 目标文件
- 文件：src/components/layout/Navbar.tsx
- 样式：Tailwind CSS，shadcn/ui

#### 结构

**固定位置：** top-0，z-index 50
**高度：** 64px
**背景：** 白色带微妙阴影（shadow-sm）
**内边距：** 0 24px（桌面）/ 0 16px（移动）

**布局：** Flex，space-between

#### 左侧部分
- Logo + 品牌名称（水平布局）
- Logo：32x32px，SVG 或 PNG
- 文本：Kappadokya（16px，600 粗细，主色）
- 链接：到主页（/）
- 右边距：auto（推动中间内容）

#### 中间部分（仅桌面）
- 导航链接（水平）
- 链接：Keşfet、Blog、Hakkımızda
- 样式：14px，柔和颜色，小写
- 悬停：颜色变为主色，下划线（1px）
- 间距：32px 间隙
- 移动端不可见

#### 右侧部分

**桌面：**
- 搜索图标（可点击 → 打开搜索模态框）
- 主题切换（太阳/月亮图标）
- 通知铃（如果已登录）
  * 徽章：通知数量（红色圆圈）
  * 点击：带最近通知的下拉菜单
- 用户菜单（如果已登录）：
  * 头像：36x36px 圆形
  * 点击：带选项的下拉菜单：
    - Profile
    - My Trips
    - Settings
    - Logout
- 登录按钮（如果未登录）：
  * 文本：Giriş Yap
  * 样式：轮廓
  * 大小：44px 高度
  * 链接：/login

**移动端：**
- 搜索图标
- 汉堡菜单（3 条线）
  * 点击：打开侧边栏导航
  * 包含：所有链接 + 用户菜单项

#### 下拉菜单

**用户菜单下拉菜单：**
- 位置：绝对，top-100%，right: 0
- 宽度：240px
- 背景：白色
- 边框：1px #E5E7EB
- 边框半径：12px
- 阴影：shadow-lg
- Z-index：60
- 项目：
  * 标题：用户名 + 电子邮件（无操作）
  * 分隔线
  * Profilim → /account/profile
  * Rotalarım → /account/trips
  * Tercihler → /account/preferences
  * 分隔线
  * Çıkış Yap → 注销操作
- 动画：淡入 + 缩放（100ms）

**通知下拉菜单：**
- 位置：类似于用户菜单
- 宽度：300px
- 高度：最大 400px（可滚动）
- 项目（最多 5 个）：
  * 每个通知的小卡片
  * 图标（铃、勾、警报等）
  * 标题 + 消息
  * 时间：2 min ago
  * 点击：导航到相关页面
- 页脚链接：Tüm bildirimleri gör

**搜索模态框：**
- 全屏叠加（移动）/ 居中模态框（桌面）
- 输入：大，自动聚焦
- 占位符：Mekan, rota, rehber ara...
- 结果：用户输入时实时
- 最近搜索：如果没有输入任何内容
- 类别：按类型分组结果
  * Places
  * Your trips
  * Blog articles
  * Users（如果有社交功能）
- 关闭：Escape 键或背景点击

#### 移动汉堡菜单

**侧边栏导航：**
- 位置：固定，left: 0，top: 0
- 宽度：100% 或 80%（取决于设计）
- 高度：100vh
- 背景：白色
- Z-index：55（在叠加之上，在模态框之下）
- 动画：从左侧滑入（300ms）

**内容：**
- 关闭按钮：右上角（X 图标）
- Logo：顶部（居中或左对齐）
- 导航链接（垂直）：
  * Home
  * Explore
  * Blog
  * About
  * 间距：项目之间 12px
- 分隔线
- 如果已登录：
  * 用户信息：头像 + 姓名 + 电子邮件
  * 账户链接（与下拉菜单相同）
- 如果未登录：
  * Giriş Yap 按钮（全宽）
  * Kayıt Ol 按钮（全宽，轮廓）

**背景：**
- 位置：固定，全屏
- 背景：rgba(0,0,0,0.5)
- Z-index：50
- 点击：关闭侧边栏
- 动画：淡入（300ms）

#### 样式

**链接：**
- 颜色：#6B7280（柔和）
- 悬停：#3B82F6（主色）
- 过渡：color 200ms
- 下划线（悬停时）：2px 实线主色

**头像：**
- 大小：36x36px（导航栏）
- 边框半径：50%
- Object-fit：cover
- 后备：彩色背景上的首字母

**图标：**
- 大小：20px（大多数图标）
- 颜色：#6B7280（默认）/ #3B82F6（活动）
- 光标：指针
- 悬停：缩放 1.1，颜色变化

**按钮：**
- 登录按钮：44px 高度，px-6，rounded-lg
- 样式：border-2 border-primary，text-primary，hover:bg-primary/5

#### 响应式

**桌面（>1024px）：**
- 完整导航栏可见
- 中间部分：可见
- 用户菜单：下拉菜单
- 汉堡：隐藏

**平板（640px-1024px）：**
- Logo 大小：较小（28px）
- 中间部分：隐藏或折叠
- 汉堡：可见
- 右侧部分：图标 + 用户菜单

**移动（<640px）：**
- 完整汉堡菜单
- 仅 logo + 图标（搜索、菜单）
- 无中间部分
- 无用户菜单下拉菜单

#### 粘性行为

**向下滚动：**
- 导航栏保持固定在顶部
- 出现/增加微妙阴影
- Logo 保持可见

**向上滚动：**
- 与上述相同（始终可见）

#### 可访问性

- Logo 链接：aria-label=Home
- 导航链接：语义 <nav> 标签
- 图标：图标上的 aria-label
- 下拉菜单：role=menu，aria-expanded
- 移动菜单：aria-label=Navigation menu
- 关闭按钮：Escape 键 + 点击

#### 动画

所有过渡：200ms ease
- 链接悬停：颜色淡入
- 下拉菜单打开：淡入 + 放大
- 移动侧边栏：从左侧滑入
- 背景：淡入

## 5. 全局组件

### 5.1 页面标题组件

**用法：** 每个页面的顶部

**内容：**
- 标题（h1）
- 面包屑（可选）
- 操作按钮（可选）

**示例：**
- 页面：My Trips
- 面包屑：Home / Account / Trips
- 按钮：+ New Trip、Import、Export

### 5.2 加载骨架

**用法：** 数据获取时

**类型：**
- 卡片骨架：多个灰色占位符
- 文本骨架：带脉冲动画的线条
- 头像骨架：圆形占位符
- 表格骨架：占位符行

**动画：** 脉冲（不透明度 0.5 → 1 → 0.5）

### 5.3 空状态组件

**用法：** 无数据时

**属性：**
- icon：Lucide 图标
- title：字符串
- description：字符串
- action：按钮或链接
- image：可选插图

**示例：**
- 图标：手提箱
- 标题：No trips yet
- 描述：Create your first itinerary
- 按钮：Create now

### 5.4 错误边界组件

全局错误捕获
- 显示友好的错误消息
- 显示错误详细信息（仅开发）
- 重新加载按钮
- 主页链接

### 5.5 面包屑组件

**属性：**
- items：[{label, href}]
- separator：/（可自定义）

**样式：**
- 字体：12px，柔和
- 链接：悬停时下划线
- 响应式：移动端隐藏（仅显示当前页面）

### 5.6 徽章组件

shadcn/ui 中已有，但变体：
- 默认：填充背景
- 轮廓：仅边框
- 次要：较浅背景
- 大小：小（12px）、中（14px）、大（16px）

### 5.7 卡片组件

shadcn/ui 中已有，但确保一致：
- 内边距：16px - 32px（可扩展）
- 边框：1px #E5E7EB
- 边框半径：12px - 16px
- 阴影：shadow-sm → shadow-lg（悬停时）

## 6. UI/UX 要求

### 6.1 设计系统

#### 调色板
- 主色：#3B82F6
- 主色深：#1E40AF
- 次要色：#EC4899
- 成功绿：#10B981
- 警告橙：#F59E0B
- 错误红：#EF4444
- 背景：#FAFAFA
- 表面：#FFFFFF
- 边框：#E5E7EB
- 文本主要：#1F2937
- 文本次要：#6B7280
- 文本柔和：#9CA3AF
- 卡帕多西亚橙：#ea580c
- 深色：#1f2937
- 柔和背景：#fafaf9
- 强调：#f97316

#### 排版
- 现代间距比例
- 清晰的视觉层次
- 高端字体选择

#### 组件
- 圆角 2xl 卡片
- 深度柔和阴影
- 选定元素上的玻璃态效果
- 微妙渐变

### 6.2 动画和交互
- Framer Motion 用于平滑过渡
- 数据获取期间的骨架加载器
- 带模糊效果的图片延迟加载
- 悬停效果：高度和柔和阴影动画
- 地图上的活动标记弹跳动画
- 点击时间线项目时平滑地图过渡

### 6.3 时间线组件
- 带可折叠部分的可滚动日列
- 带摘要徽章（距离、时长、预算）的大型日标题
- TimelineItem 卡片显示：
  - 大型 16:9 Google Place 照片
  - 图片上的时间徽章叠加
  - 地点名称
  - 评分徽章（右上角）
  - 简短描述
- 地点之间的旅行时间块
- 点击交互：
  - 在地点上居中地图
  - 缩放到级别 14
  - 用弹跳动画高亮标记
  - 打开 InfoWindow

### 6.4 地图组件
- 粘性定位（30% 宽度）
- 与时间线滚动同步
- 地点的自定义 SVG 标记
- 显示路线的折线
- 带图片、评分和在 Google Maps 中打开按钮的 InfoWindow
- 响应式缩放和平移
- 平滑过渡

### 6.5 加载状态
- AI 生成期间的进度条
- 带模糊地图背景的设计您的旅程动画
- 地点卡片的骨架屏幕
- 图片延迟加载模糊效果

### 6.6 移动体验
- 底部表单地图界面
- 可滑动的日选项卡
- 底部固定优化路线按钮
- 完全响应式布局
- 触摸优化交互

## 7. 数据模型

### 7.1 OpenAI 响应格式
```
{
  days: [
    {
      day: 1,
      items: [
        {
          place_name: Göreme Open Air Museum,
          category: museum,
          estimated_duration_minutes: 120,
          description: Short explanation
        }
      ]
    }
  ]
}
```

### 7.2 已验证地点对象
- place_id
- name
- lat
- lng
- rating
- formatted_address
- photo_reference
- image_url
- description
- category
- estimated_duration_minutes

### 7.3 最终行程结构
```
{
  id: UUID,
  days: [
    {
      day: 1,
      total_distance: 25 km,
      total_duration: 6 hours,
      estimated_budget: $150,
      items: [
        {
          place_id: ChIJ...,
          name: Göreme Open Air Museum,
          lat: 38.6431,
          lng: 34.8347,
          rating: 4.6,
          image_url: https://maps.googleapis.com/...,
          formatted_address: Göreme, Nevşehir,
          description: UNESCO World Heritage site,
          start_time: 09:00,
          end_time: 11:00
        }
      ]
    }
  ]
}
```

## 8. 性能优化

### 8.1 缓存策略
- 在 Supabase places_cache 表中缓存 Google Places 解析结果
- 在 Supabase directions_cache 表中缓存 Google Directions API 响应
- 在 Supabase Storage place-photos 存储桶中缓存地点照片二进制数据
- 避免对相同地点的重复 API 调用
- 首次获取后存储照片 URL

### 8.2 优化技术
- 防抖表单提交
- 带模糊效果的延迟加载图片
- 优化 React 重新渲染
- 对时间线项目使用 React.memo
- 如果需要，虚拟化长列表
- Framer Motion 性能优化

## 9. 错误处理

### 9.1 API 失败
- OpenAI 超时后备带重试
- Google API 失败处理带用户通知
- 服务不可用时的优雅降级

### 9.2 数据验证
- OpenAI 响应的 JSON 验证
- 删除重复地点
- 防止重叠时间段
- 验证 place_id 解析

### 9.3 用户反馈
- 清晰的错误消息
- 处理期间的加载状态
- 成功确认

## 10. 安全要求

### 10.1 API 密钥管理
- OpenAI API 密钥仅存储在服务器端
- Google Maps API 密钥受域限制
- 所有敏感密钥在环境变量中
- 永远不要在客户端代码中暴露密钥

### 10.2 数据保护
- 验证所有用户输入
- 存储前清理数据
- 安全的 localStorage 使用

### 10.3 认证安全
- Supabase 处理认证
- 密码哈希和加密
- 安全会话管理
- 双因素认证支持
- 所有通信仅 HTTPS

## 11. 未来可扩展性

### 11.1 数据库集成
- localStorage 结构设计为易于迁移
- 基于 UUID 的标识支持数据库键
- 数据模型与关系型/NoSQL 数据库兼容
- Supabase 缓存表用于 API 响应优化

### 11.2 可扩展性
- 模块化服务架构
- 关注点分离
- 易于添加新功能或区域
- 可插拔 AI 提供商

## 12. 技术实现细节

### 12.1 文件结构
- 目标文件：src/pages/LandingPage.tsx
- 目标文件：src/pages/PlannerPage.tsx
- 目标文件：src/pages/ExplorePage.tsx
- 目标文件：src/pages/LoginPage.tsx
- 目标文件：src/pages/AccountPage.tsx
- 目标文件：src/components/layout/Navbar.tsx
- 技术栈：React + TypeScript + Tailwind CSS + shadcn/ui
- 现有依赖：@dnd-kit、lucide-react、sonner（toast）、react-hook-form、zod
- 认证：Supabase + miaoda-auth-react
- 数据库：Supabase（缓存表）
- 存储：Supabase Storage（地点照片）

### 12.2 数据库架构

#### places_cache 表
- id：uuid 主键
- place_name_normalized：text（小写，修剪 - 用作查找键）
- place_id：text NOT NULL
- name：text
- formatted_address：text
- lat：float8
- lng：float8
- rating：float4
- user_ratings_total：int4
- photo_reference：text
- created_at：timestamptz DEFAULT now()
- updated_at：timestamptz DEFAULT now()
- place_name_normalized 上的唯一约束
- RLS 禁用（通过 service_role 密钥访问）

#### directions_cache 表
- id：uuid 主键
- cache_key：text UNIQUE NOT NULL（格式：origin_lat,lng|dest_lat,lng）
- response：jsonb
- created_at：timestamptz DEFAULT now()
- RLS 禁用（通过 service_role 密钥访问）

#### 迁移文件
- 文件路径：supabase/migrations/00004_add_cache_tables.sql

## 13. 其他要求

### 13.1 地点缓存层重构

**目标文件：** supabase/functions/generate-itinerary/index.ts

**实现要求：**

1. Supabase 客户端初始化：
   - 在 Edge Function 内部使用 Supabase service_role 客户端
   - 从 https://esm.sh/@supabase/supabase-js@2 导入 createClient
   - 使用 Deno.env.get('SUPABASE_URL') 和 Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

2. 地点验证循环优化（步骤 2，调用 Google Places Text Search 的位置）：

   在为每个项目调用 Google Places API 之前：
   
   a) 规范化地点名称：
      - 转换为小写
      - 修剪空格
   
   b) 查询 places_cache 表：
      - 执行查询：SELECT * FROM places_cache WHERE place_name_normalized = normalizedName LIMIT 1
   
   c) 缓存命中处理：
      - 如果找到缓存行，直接使用它（完全跳过 Google API 调用）
      - 在代码中记录注释：// Cache HIT - skipping Google API call
   
   d) 缓存未命中处理：
      - 如果未找到，按原样调用 Google Places Text Search
      - 然后将结果 INSERT 到 places_cache 中，使用规范化名称
      - 在代码中记录注释：// Cache MISS - fetching from Google and caching

3. 缓存优势：
   - 相同地点（例如 Göreme Open Air Museum）只会从 Google 获取一次
   - 之后永久从缓存提供
   - 显著减少 API 调用次数和响应时间

### 13.2 路线缓存层重构

**目标文件：** supabase/functions/get-directions/index.ts

**实现要求：**

1. Supabase 客户端初始化：
   - 在 Edge Function 内部使用 Supabase service_role 客户端
   - 从 https://esm.sh/@supabase/supabase-js@2 导入 createClient
   - 使用 Deno.env.get('SUPABASE_URL') 和 Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

2. 路线计算优化：

   在调用 Google Directions API 之前：
   
   a) 构建缓存键：
      - 格式：`${origin}|${destination}|${waypoints?.join(',') ?? ''}`
      - origin 和 destination 为坐标字符串（如 38.6431,34.8347）
      - waypoints 为可选的中间点数组
   
   b) 查询 directions_cache 表：
      - 执行查询：SELECT * FROM directions_cache WHERE cache_key = cacheKey LIMIT 1
   
   c) 缓存命中处理：
      - 如果找到缓存行且 created_at 距今不超过 30 天，直接返回缓存的 response jsonb
      - 在代码中记录注释：// Cache HIT - returning cached directions
   
   d) 缓存未命中或过期处理：
      - 如果未找到或缓存已过期（超过 30 天），调用 Google Directions API
      - 然后将结果 UPSERT 到 directions_cache 中（使用 cache_key 作为唯一键）
      - 在代码中记录注释：// Cache MISS or expired - fetching from Google and caching

3. 缓存优势：
   - 相同路线（相同起点、终点和途经点）只会从 Google 计算一次
   - 30 天内重复请求直接从缓存返回
   - 显著减少 API 调用次数和响应时间
   - 避免重复计算相同路线

### 13.3 卡帕多西亚景点数据预填充

**目标文件：** supabase/migrations/00005_seed_cappadocia_places.sql

**实现要求：**

1. 创建新的 Supabase 迁移文件，用于预填充 places_cache 表

2. 插入卡帕多西亚最常见景点的真实数据，包括：
   - Göreme Open Air Museum
   - Uçhisar Castle
   - Derinkuyu Underground City
   - Kaymaklı Underground City
   - Pasabag (Monks Valley)
   - Devrent Valley (Imagination Valley)
   - Love Valley
   - Rose Valley (Güllüdere)
   - Pigeon Valley
   - Zelve Open Air Museum
   - Avanos Pottery
   - El Nazar Church
   - Dark Church (Karanlık Kilise)
   - Çavuşin Village

3. 数据要求：
   - 使用真实的 Google place_id（从 Google Maps 获取）
   - 包含准确的经纬度坐标
   - 包含真实的评分数据
   - place_name_normalized 设置为小写英文名称

4. 预填充优势：
   - 首次用户请求也能命中缓存
   - 消除冷启动时的 Google API 调用成本
   - 提升首次用户体验的响应速度

### 13.4 地点照片缓存层重构

**目标文件：** supabase/functions/get-place-photo/index.ts

**实现要求：**

1. Supabase Storage 存储桶创建：
   - 创建名为 place-photos 的公共存储桶
   - 配置为公共访问

2. Supabase 客户端初始化：
   - 在 Edge Function 内部使用 Supabase service_role 客户端
   - 从 https://esm.sh/@supabase/supabase-js@2 导入 createClient
   - 使用 Deno.env.get('SUPABASE_URL') 和 Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

3. 照片缓存逻辑：

   在调用 Google Places Photo API 之前：
   
   a) 构建存储路径：
      - 格式：`photos/${photo_reference}.jpg`
      - photo_reference 为 Google Places API 返回的照片引用 ID
   
   b) 检查文件是否存在：
      - 使用 supabase.storage.from('place-photos').getPublicUrl(path) 获取公共 URL
      - 尝试 HEAD 请求检查文件是否存在
   
   c) 缓存命中处理：
      - 如果文件存在，直接返回重定向到 Supabase Storage 公共 URL
      - 在代码中记录注释：// Cache HIT - redirecting to storage URL
   
   d) 缓存未命中处理：
      - 如果文件不存在，从 Google Places Photo API 获取图片
      - 将图片上传到 Supabase Storage，content-type 设置为 image/jpeg
      - 然后返回重定向到 Supabase Storage 公共 URL
      - 在代码中记录注释：// Cache MISS - fetching from Google and uploading to storage

4. 缓存优势：
   - 相同照片只会从 Google 获取一次
   - 之后永久从 Supabase Storage 提供
   - 消除重复的 Google Places Photo API 调用成本
   - 提升照片加载速度和稳定性

## 14. 参考文件

1. 设计模型：ChatGPT Image 13 Şub 2026 12_19_59.png