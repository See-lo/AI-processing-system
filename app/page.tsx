"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "analyze" | "generate" | "generateVideo"
  >("analyze");
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<
    "idle" | "creating" | "polling" | "completed" | "error"
  >("idle");
  const [videoError, setVideoError] = useState<string | null>(null);
  // 添加本地图片相关状态
  const [localImage, setLocalImage] = useState<File | null>(null);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"url" | "local">("url");

  // 处理图片 URL 输入
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    if (showPreview) {
      setShowPreview(false);
      setImageLoading(false);
    }
    // 切换到URL输入模式
    setInputMethod("url");
    // 清除本地图片
    if (localImageUrl) {
      URL.revokeObjectURL(localImageUrl);
      setLocalImageUrl(null);
      setLocalImage(null);
    }
  };

  // 处理本地图片上传
  const handleLocalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 清除之前的URL
      if (localImageUrl) {
        URL.revokeObjectURL(localImageUrl);
      }
      // 创建新的临时URL
      const objectUrl = URL.createObjectURL(file);
      setLocalImage(file);
      setLocalImageUrl(objectUrl);
      setInputMethod("local");
      setImageUrl(""); // 清除URL输入
      setImageLoading(true);
      setShowPreview(true);
    }
  };

  // 验证 URL 并显示预览
  const handlePreviewImage = () => {
    if (imageUrl.trim()) {
      try {
        // 验证 URL 格式
        new URL(imageUrl);
        setImageLoading(true);
        setShowPreview(true);
      } catch {
        alert("请输入有效的图片URL");
      }
    }
  };

  const handleAnalyze = async () => {
    // 检查是否有图片输入（URL或本地文件）
    if (!imageUrl.trim() && !localImageUrl) {
      alert("请输入图片URL或上传本地图片");
      return;
    }

    setLoading(true);
    try {
      let imageUrlToSend = imageUrl;
      
      // 如果是本地图片，需要先处理
      if (inputMethod === "local" && localImage) {
        // 将本地图片转换为base64格式
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("图片转换失败"));
          reader.readAsDataURL(localImage);
        });
        imageUrlToSend = await base64Promise;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageUrlToSend,
        }),
      });

      if (!response.ok) {
        throw new Error("分析请求失败");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
    } catch (error) {
      console.error("分析错误:", error);
      setResult("分析过程中发生错误，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("请输入图片描述");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("生成请求失败");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedImage(data.imageUrl);
    } catch (error) {
      console.error("生成错误:", error);
      alert("生成过程中发生错误，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      alert("请输入视频描述");
      return;
    }

    setGeneratingVideo(true);
    setVideoStatus("creating");
    setVideoError(null);
    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: videoPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "生成请求失败");
      }

      if (data.taskId) {
// 由于 videoTaskId 状态变量已被移除，这里不再需要设置它
// 直接继续执行后续的轮询逻辑
        setVideoStatus("polling");
        startPolling(data.taskId);
      }
    } catch (error) {
      console.error("生成错误:", error);
      setVideoError(
        error instanceof Error ? error.message : "生成过程中发生错误"
      );
      setVideoStatus("error");
    }
  };

  const startPolling = async (taskId: string) => {
    try {
      while (true) {
        const response = await fetch(
          `/api/generate-video/status?taskId=${taskId}`
        );
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || "查询失败");
        }

        if (data.status === "succeeded" && data.videoUrl) {
          setGeneratedVideo(data.videoUrl);
          setVideoStatus("completed");
          setGeneratingVideo(false);
          break;
        }

        // 等待 5 秒后继续查询
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error("查询错误:", error);
      setVideoError(
        error instanceof Error ? error.message : "查询过程中发生错误"
      );
      setVideoStatus("error");
      setGeneratingVideo(false);
    }
  };

  const renderVideoStatus = () => {
    switch (videoStatus) {
      case "creating":
        return "正在创建生成任务...";
      case "polling":
        return "正在生成视频，请耐心等待...";
      case "error":
        return `生成失败: ${videoError}`;
      default:
        return "生成的视频将在这里显示...";
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-400 via-orange-300 to-yellow-200 dark:from-red-900 dark:via-orange-800 dark:to-yellow-700 pattern-grid-lg pattern-white/5 dark:pattern-white/5 pattern-bg-transparent'>
      <div className='container mx-auto px-4 py-12'>
        {/* 标题区域 */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2'>
            AI 处理系统
          </h1>
          <p className='text-gray-600 dark:text-gray-300'>
            AI 图片解析 · AI 文生图 · AI 文生视频
          </p>
        </div>

        {/* 标签页切换 */}
        <div className='flex justify-center mb-12'>
          <div className='flex gap-2 p-1.5 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg rounded-2xl shadow-lg'>
            <Button
              variant={activeTab === "analyze" ? "default" : "ghost"}
              onClick={() => setActiveTab("analyze")}
              className={cn(
                "rounded-xl transition-all duration-300",
                activeTab === "analyze"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "hover:bg-white/50 dark:hover:bg-gray-700/50"
              )}
            >
             AI 图片解析
            </Button>
            <Button
              variant={activeTab === "generate" ? "default" : "ghost"}
              onClick={() => setActiveTab("generate")}
              className={cn(
                "rounded-xl transition-all duration-300",
                activeTab === "generate"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "hover:bg-white/50 dark:hover:bg-gray-700/50"
              )}
            >
              AI 文生图
            </Button>
            <Button
              variant={activeTab === "generateVideo" ? "default" : "ghost"}
              onClick={() => setActiveTab("generateVideo")}
              className={cn(
                "rounded-xl transition-all duration-300",
                activeTab === "generateVideo"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "hover:bg-white/50 dark:hover:bg-gray-700/50"
              )}
            >
              AI 文生视频
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className='max-w-7xl mx-auto'>
          {activeTab === "analyze" ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card className='backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-[500px]'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                    输入区域
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* URL 输入和预览区域 */}
                  <div className='space-y-4'>
                    <div className='flex gap-2'>
                      <div className='flex-1'>
                        <Input
                          type='url'
                          placeholder='请输入图片URL...'
                          value={imageUrl}
                          onChange={handleImageUrlChange}
                          onBlur={handlePreviewImage}
                          className='bg-white/50 dark:bg-gray-900/50 border-0 focus:ring-2 ring-purple-500'
                          disabled={inputMethod === "local"}
                        />
                      </div>
                      <Button
                        variant='outline'
                        onClick={handlePreviewImage}
                        className='border-0 bg-white/50 dark:bg-gray-900/50 hover:bg-purple-500 hover:text-white transition-all duration-300'
                        disabled={inputMethod === "local" || !imageUrl.trim()}
                      >
                        预览
                      </Button>
                    </div>
                    
                    {/* 本地图片上传 */}
                    <div className='flex items-center gap-2'>
                      <div className='flex-1'>
                        <label 
                          htmlFor="local-image-upload"
                          className={cn(
                            "flex h-9 items-center justify-center w-full rounded-md border border-dashed",
                            "bg-white/50 dark:bg-gray-900/50 px-3 py-1 text-sm cursor-pointer",
                            "hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors",
                            inputMethod === "local" ? "border-purple-500" : "border-gray-300 dark:border-gray-700"
                          )}
                        >
                          {localImage ? localImage.name : "点击上传本地图片"}
                        </label>
                        <input
                          id="local-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLocalImageChange}
                        />
                      </div>
                      {localImage && (
                        <Button
                          variant='outline'
                          onClick={() => {
                            if (localImageUrl) {
                              URL.revokeObjectURL(localImageUrl);
                            }
                            setLocalImage(null);
                            setLocalImageUrl(null);
                            setInputMethod("url");
                            setShowPreview(false);
                          }}
                          className='border-0 bg-white/50 dark:bg-gray-900/50 hover:bg-red-500 hover:text-white transition-all duration-300'
                        >
                          清除
                        </Button>
                      )}
                    </div>
                    
                    <div className='w-full aspect-video relative bg-white/30 dark:bg-gray-900/30 rounded-xl overflow-hidden backdrop-blur-sm h-[200px]'>           
                      {!showPreview ? (
                        <div className='absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400'>
                          输入URL或上传本地图片
                        </div>
                      ) : (
                        <>
                          {imageLoading && (
                            <div className='absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10'>
                              <Loader2 className='h-8 w-8 animate-spin text-purple-500' />
                            </div>
                          )}
                          <div
                            className={cn(
                              "relative w-full h-full transition-all duration-300",
                              imageLoading
                                ? "opacity-0 scale-95"
                                : "opacity-100 scale-100"
                            )}
                          >
                            {typeof window !== 'undefined' && (inputMethod === "local" ? localImageUrl : imageUrl) ? (
                              <Image
                                src={inputMethod === "local" ? localImageUrl || "" : imageUrl}
                                alt='Preview image'
                                fill
                                className='object-contain'
                                onError={() => {
                                  setShowPreview(false);
                                  setImageLoading(false);
                                  alert("图片加载失败，请检查URL是否正确");
                                }}
                                onLoadingComplete={() => {
                                  setImageLoading(false);
                                }}
                                unoptimized
                              />
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  </div>



                  <Button
                    onClick={handleAnalyze}
                    className={cn(
                      "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition-all duration-300",
                      "hover:shadow-lg hover:from-purple-600 hover:to-pink-600",
                      "disabled:from-gray-400 disabled:to-gray-500"
                    )}
                    disabled={(!imageUrl && !localImageUrl) || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        分析中...
                      </>
                    ) : (
                      "开始分析"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 结果显示卡片 */}
              <Card className='backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-[500px] overflow-auto'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                    分析结果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='min-h-[350px] p-6 bg-white/50 dark:bg-gray-900/50 rounded-xl'>
                    {result ? (
                      <p className='whitespace-pre-wrap text-gray-700 dark:text-gray-200'>
                        {result}
                      </p>
                    ) : (
                      <p className='text-gray-500 dark:text-gray-400 text-center'>
                        分析结果将在这里显示...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "generate" ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card className='backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-[500px]'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>生成设置</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Textarea
                    placeholder='请输入图片描述...'
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className='min-h-[350px] bg-white/50 dark:bg-gray-900/50 border-0 focus:ring-2 ring-purple-500 rounded-lg'
                  />
                  <Button
                    onClick={handleGenerate}
                    className={cn(
                      "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition-all duration-300",
                      "hover:shadow-lg hover:from-purple-600 hover:to-pink-600",
                      "disabled:from-gray-400 disabled:to-gray-500"
                    )}
                    disabled={!prompt || generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        生成中...
                      </>
                    ) : (
                      "开始生成"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className='backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-[500px]'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>生成结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='w-full aspect-square relative bg-white/30 dark:bg-gray-900/30 rounded-xl overflow-hidden backdrop-blur-sm shadow-inner h-[400px]'>
                    {typeof window !== 'undefined' && generatedImage ? (
                      <Image
                        src={generatedImage}
                        alt='Generated image'
                        fill
                        className='object-contain'
                        unoptimized
                        key={generatedImage}
                      />
                    ) : (
                      <div className='absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm '>
                        <p className='text-center px-4 py-2 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-sm '>生成的图片将在这里显示...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card className='backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-[500px]'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>视频生成设置</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Textarea
                    placeholder='请输入视频描述...'
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className='min-h-[350px] bg-white/50 dark:bg-gray-900/50 border-0 focus:ring-2 ring-purple-500 rounded-lg'
                    disabled={generatingVideo}
                  />
                  <Button
                    onClick={handleGenerateVideo}
                    className={cn(
                      "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition-all duration-300",
                      "hover:shadow-lg hover:from-purple-600 hover:to-pink-600",
                      "disabled:from-gray-400 disabled:to-gray-500"
                    )}
                    disabled={!videoPrompt || generatingVideo}
                  >
                    {generatingVideo ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        {videoStatus === "creating"
                          ? "创建任务中..."
                          : "生成中..."}
                      </>
                    ) : (
                      "开始生成"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className='backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>生成结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='w-full aspect-video relative bg-white/30 dark:bg-gray-900/30 rounded-xl overflow-hidden backdrop-blur-sm shadow-inner h-[400px]'>
                    {typeof window !== 'undefined' && generatedVideo ? (
                      <video
                        src={generatedVideo}
                        controls
                        className='w-full h-full'
                        autoPlay
                        loop
                      >
                        您的浏览器不支持视频播放
                      </video>
                    ) : (
                      <div className='absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm'>
                        {generatingVideo ? (
                          <div className='flex flex-col items-center gap-3'>
                            <Loader2 className='h-10 w-10 animate-spin text-purple-500' />
                            <p className='text-center px-4 py-2 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-sm'>{renderVideoStatus()}</p>
                          </div>
                        ) : (
                          <p className='text-center px-4 py-2 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-sm'>{renderVideoStatus()}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
