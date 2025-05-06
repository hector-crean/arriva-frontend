"use client";

import { useEffect, useState } from "react";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import rehypeMermaid from "rehype-mermaid";
import rehypePrettyCode from "rehype-pretty-code";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Docs = () => {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setIsLoading(true);
        
        // Add a timestamp to prevent caching
        const response = await fetch(`/graph.md?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
        
        const markdown = await response.text();
        setRawMarkdown(markdown);
        
        console.log("Markdown fetched successfully, length:", markdown.length);
        console.log("First 100 chars:", markdown.substring(0, 100));
        
        try {
          const mdxSource = await serialize(markdown, {
            mdxOptions: {
              rehypePlugins: [
                [rehypeMermaid, { strategy: "inline-svg" }],
                [rehypePrettyCode, {
                  theme: "github-dark",
                  keepBackground: true,
                  onVisitLine(node) {
                    // Prevent lines from collapsing in `display: grid` mode
                    if (node.children.length === 0) {
                      node.children = [{ type: "text", value: " " }];
                    }
                  },
                  onVisitHighlightedLine(node) {
                    node.properties.className.push("highlighted");
                  },
                  onVisitHighlightedWord(node) {
                    node.properties.className = ["word"];
                  }
                }]
              ],
            },
          });
          
          setMdxSource(mdxSource);
        } catch (mdxError) {
          console.error("Error processing MDX:", mdxError);
          setError(`MDX processing error: ${mdxError instanceof Error ? mdxError.message : String(mdxError)}`);
        }
      } catch (fetchErr) {
        console.error("Error fetching markdown:", fetchErr);
        setFetchError(`Failed to load markdown: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkdown();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Architecture Documentation</h1>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md prose prose-lg max-w-none">
        {isLoading && <p>Loading documentation...</p>}
        
        {fetchError && (
          <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700 mb-4">
            <h3 className="font-bold">Fetch Error:</h3>
            <p>{fetchError}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-700 mb-4">
            <h3 className="font-bold">MDX Processing Error:</h3>
            <p>{error}</p>
            {rawMarkdown && (
              <div className="mt-4">
                <p className="font-semibold">Showing raw markdown instead:</p>
              </div>
            )}
          </div>
        )}
        
        {mdxSource && (
          <div className="mdx-content">
            <style jsx global>{`
              .mdx-content pre {
                overflow-x: auto;
                border-radius: 0.375rem;
                background-color: #0d1117 !important;
                border: 1px solid #30363d;
              }
              
              .mdx-content code {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                font-size: 0.875rem;
                line-height: 1.5;
              }
              
              .mdx-content .highlighted {
                background-color: rgba(255, 255, 255, 0.1);
                border-left: 3px solid #58a6ff;
                padding-left: 0.5rem;
              }
              
              .mdx-content .word {
                background-color: rgba(255, 235, 113, 0.2);
                padding: 0.125rem;
                border-radius: 0.25rem;
              }
            `}</style>
            <MDXRemote {...mdxSource} />
          </div>
        )}
        
        {!mdxSource && rawMarkdown && (
          <div className="mt-4 whitespace-pre-wrap bg-gray-50 p-4 rounded overflow-auto">
            <pre className="text-sm">{rawMarkdown}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 

export { Docs };