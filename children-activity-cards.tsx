import { Heart, Users, Clock, MapPin, Star, Calendar, Gift, Camera, Sparkles, Play } from "lucide-react";
import { useState, useEffect } from "react";

// Utils function
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface ActivityCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  time?: string;
  participants?: number;
  location?: string;
  rating?: number;
  image?: string;
  tags?: string[];
  iconClassName?: string;
  titleClassName?: string;
  price?: string;
  difficulty?: "简单" | "中等" | "困难";
}

function ActivityCard({
  className,
  icon = <Heart className="size-5 text-white" />,
  title = "温馨手工课",
  description = "和小朋友们一起制作可爱的手工艺品，培养动手能力和创造力",
  time = "今天 14:00",
  participants = 12,
  location = "活动室A",
  rating = 4.8,
  image,
  tags = ["手工", "创意"],
  iconClassName = "text-white",
  titleClassName = "text-pink-600",
  price = "免费",
  difficulty = "简单",
}: ActivityCardProps) {
  const [hovered, setHovered] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  // Generate floating sparkles on hover
  useEffect(() => {
    if (hovered) {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2000,
      }));
      setSparkles(newSparkles);
    } else {
      setSparkles([]);
    }
  }, [hovered]);

  const difficultyColors = {
    简单: "from-green-400 to-emerald-500 text-white",
    中等: "from-yellow-400 to-orange-500 text-white", 
    困难: "from-red-400 to-pink-500 text-white"
  };

  return (
    <article
      className={cn(
        "group relative flex h-64 w-full max-w-sm select-none flex-col justify-between rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 transition-all duration-700 ease-out hover:border-white/30 hover:bg-white/20 hover:shadow-2xl hover:shadow-pink-500/20 hover:scale-[1.02] hover:-translate-y-3 cursor-pointer",
        "before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-pink-500/20 before:via-purple-500/10 before:to-orange-500/20 before:opacity-0 before:transition-opacity before:duration-700 hover:before:opacity-100",
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${title} - ${description}`}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="absolute animate-ping"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              animationDelay: `${sparkle.delay}ms`,
              animationDuration: "3s",
            }}
          >
            <Sparkles className="size-2 text-yellow-300 opacity-60" />
          </div>
        ))}
      </div>

      {/* Gradient Orb Effect */}
      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-400/30 blur-2xl transition-all duration-1000 group-hover:scale-150 group-hover:opacity-60" />
      
      {/* Header Section */}
      <div className="relative z-20 flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className={cn(
              "inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl",
              iconClassName
            )}>
              {icon}
            </span>
            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 opacity-0 transition-all duration-700 group-hover:opacity-30 group-hover:scale-125 group-hover:animate-pulse" />
          </div>
          
          <div className="flex-1">
            <h3 className={cn(
              "text-xl font-bold leading-tight mb-1 transition-colors duration-300",
              titleClassName
            )}>
              {title}
            </h3>
            
            {/* Rating and Difficulty */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="size-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-300">{rating}</span>
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r shadow-sm",
                difficultyColors[difficulty]
              )}>
                {difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Price Badge */}
        <div className="text-right">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-2 shadow-lg">
            <span className="text-xs font-bold text-white">{price}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="relative z-20 flex-1 mb-4">
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 line-clamp-3 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
          {description}
        </p>
      </div>

      {/* Tags */}
      <div className="relative z-20 flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="rounded-xl bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:from-gray-800/80 dark:to-gray-700/80 dark:text-gray-200"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer Info */}
      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg px-2 py-1 backdrop-blur-sm">
            <Clock className="size-3.5 text-blue-500" />
            <span className="font-medium">{time}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg px-2 py-1 backdrop-blur-sm">
            <MapPin className="size-3.5 text-green-500" />
            <span className="font-medium">{location}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg px-2 py-1 backdrop-blur-sm">
            <Users className="size-3.5 text-purple-500" />
            <span className="font-medium">{participants}人</span>
          </div>
        </div>
        
        {/* Enhanced Action Button */}
        <button 
          className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
          aria-label={`报名参加 ${title}`}
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 group-hover/btn:translate-x-full" />
          <span className="relative flex items-center gap-2">
            <Play className="size-4" />
            报名参加
          </span>
        </button>
      </div>

      {/* Enhanced Hover Glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-orange-500/10 opacity-0 transition-all duration-700 group-hover:opacity-100" />
      
      {/* Border Glow Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-400 via-purple-400 to-orange-400 opacity-0 blur-sm transition-all duration-700 group-hover:opacity-20 -z-10" />
    </article>
  );
}

interface ChildrenActivityCardsProps {
  activities?: ActivityCardProps[];
}

export default function ChildrenActivityCards({ activities }: ChildrenActivityCardsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultActivities = [
    {
      icon: <Gift className="size-5 text-white" />,
      title: "创意手工坊",
      description: "在温馨的环境中，小朋友们将学习制作精美的手工艺品。通过剪纸、粘贴、绘画等活动，不仅能培养孩子们的动手能力和创造力，还能让他们在合作中学会分享与互助。",
      time: "今天 14:00",
      participants: 12,
      location: "创意工作室",
      rating: 4.8,
      tags: ["手工", "创意", "艺术"],
      price: "￥39",
      difficulty: "简单" as const,
      className: "bg-gradient-to-br from-pink-400/20 via-rose-300/20 to-orange-400/20",
    },
    {
      icon: <Camera className="size-5 text-white" />,
      title: "小小摄影师",
      description: "让孩子们拿起相机，用纯真的眼光捕捉世界的美好。专业老师将指导他们学习基础摄影技巧，培养观察力和审美能力，记录童年最珍贵的瞬间。",
      time: "明天 10:00",
      participants: 8,
      location: "阳光花园",
      rating: 4.9,
      tags: ["摄影", "艺术", "探索"],
      price: "￥59",
      difficulty: "中等" as const,
      className: "bg-gradient-to-br from-blue-400/20 via-cyan-300/20 to-purple-400/20",
      titleClassName: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <Calendar className="size-5 text-white" />,
      title: "童话故事会",
      description: "在舒适的阅读角落，孩子们围坐成圈，轮流分享自己喜爱的故事。这不仅能提升他们的语言表达能力，还能增进小伙伴们之间的友谊，培养倾听和理解的品质。",
      time: "周六 15:30",
      participants: 15,
      location: "温馨阅读角",
      rating: 4.7,
      tags: ["阅读", "分享", "想象"],
      price: "免费",
      difficulty: "简单" as const,
      className: "bg-gradient-to-br from-green-400/20 via-emerald-300/20 to-teal-400/20",
      titleClassName: "text-green-600 dark:text-green-400",
    },
    {
      icon: <Sparkles className="size-5 text-white" />,
      title: "魔法科学实验",
      description: "通过安全有趣的科学小实验，激发孩子们对科学的好奇心。在老师的指导下，小朋友们将亲手制作彩虹、观察化学反应，在玩乐中学习科学知识。",
      time: "周日 16:00",
      participants: 10,
      location: "科学实验室",
      rating: 4.9,
      tags: ["科学", "实验", "探索"],
      price: "￥79",
      difficulty: "中等" as const,
      className: "bg-gradient-to-br from-purple-400/20 via-indigo-300/20 to-blue-400/20",
      titleClassName: "text-purple-600 dark:text-purple-400",
    },
  ];

  const displayActivities = activities || defaultActivities;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 via-yellow-50 to-green-50 dark:from-gray-950 dark:via-purple-950/50 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-pink-300/20 to-purple-300/20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <Heart className="size-12 text-pink-500 fill-pink-400 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-pink-400 blur-xl opacity-30 animate-pulse" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
              小家活动中心
            </h1>
            <div className="relative">
              <Sparkles className="size-12 text-orange-500 fill-orange-400 animate-bounce" />
              <div className="absolute inset-0 rounded-full bg-orange-400 blur-xl opacity-30 animate-bounce" />
            </div>
          </div>
          
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
            为每一个小天使精心设计的成长乐园 ✨ 
            <br />
            <span className="text-base text-gray-600 dark:text-gray-400">
              在这里，孩子们将收获知识、友谊和无尽的快乐回忆
            </span>
          </p>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-8 mt-8 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg shadow-lg max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">50+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">精彩活动</div>
            </div>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">500+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">快乐小朋友</div>
            </div>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">4.8★</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">平均评分</div>
            </div>
          </div>
        </header>

        {/* Enhanced Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          {displayActivities.map((activity, index) => (
            <div
              key={index}
              className="transform transition-all duration-500"
              style={{
                animationDelay: mounted ? `${index * 100}ms` : '0ms',
              }}
            >
              <ActivityCard {...activity} />
            </div>
          ))}
        </div>

        {/* Enhanced Call-to-Action Section */}
        <div className="relative">
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-white/80 to-pink-50/80 dark:from-gray-800/80 dark:to-purple-900/40 backdrop-blur-xl p-8 shadow-2xl border border-white/20">
              {/* Animated Hearts */}
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Heart
                    key={i}
                    className="size-6 text-pink-500 fill-pink-400 animate-bounce"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-3">
                  用爱心陪伴每一个孩子的成长
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto text-sm sm:text-base">
                  在这里，每个孩子都是独一无二的小星星，我们用耐心和关爱，点亮他们心中的梦想之光
                </p>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-3 text-white font-bold shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/30 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">立即咨询报名</span>
                </button>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  咨询热线: <span className="text-pink-600 dark:text-pink-400 font-bold">400-123-4567</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}