'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, Loader2, Search, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Image from 'next/image'

// Define the type for a single scraped content item
interface ScrapedContentItem {
  url: string;
  markdown: string;
}

export function LandingPage() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [scrapedContent, setScrapedContent] = useState<ScrapedContentItem[]>([])

  const exampleDocs = [
    'OpenAI API',
    'React Documentation',
    'Next.js Guide',
    'TypeScript Handbook',
    'Framer Motion API'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, limit: 10 }), // Adjust limit as needed
      });
      const data = await response.json();
      setScrapedContent(data.scrapedContent);
      setShowResults(true);
    } catch (error) {
      console.error('Error during crawl:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground flex flex-col items-center justify-center p-4">
      <Button
        variant="outline"
        className="absolute top-4 right-4 hover:bg-primary hover:text-primary-foreground transition-colors"
        onClick={() => window.open('https://github.com/arnenoori/cursor-prompter', '_blank')}
      >
        <Github className="mr-2 h-4 w-4" />
        Star on GitHub
      </Button>

      <Card className="w-full max-w-2xl shadow-lg">
        <CardContent className="pt-6">
          <h1 className="text-5xl font-bold text-center mb-2">Turn websites into</h1>
          <h1 className="text-5xl font-bold text-center mb-4">
            <span className="text-orange-500 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">LLM-ready</span> data
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Power your AI apps with clean data crawled from any website. It&apos;s also open-source.
          </p>

          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="url-input">Get prompt from developer docs</Label>
                  <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <Input
                      id="url-input"
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-grow"
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crawl'}
                    </Button>
                  </form>
                </div>

                <div className="text-center font-semibold">or</div>

                <div className="space-y-2">
                  <Label htmlFor="search-input">Search Existing Docs</Label>
                  <Input
                    id="search-input"
                    type="search"
                    placeholder="Search existing docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1 overflow-hidden"
                      >
                        {exampleDocs
                          .filter(doc => doc.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((doc, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: index * 0.1 }}
                              className="cursor-pointer hover:text-orange-500 transition-colors"
                              onClick={() => {
                                setIsLoading(true)
                                setTimeout(() => {
                                  setIsLoading(false)
                                  setShowResults(true)
                                }, 1500)
                              }}
                            >
                              <Search className="inline mr-2 h-4 w-4" />{doc}
                            </motion.li>
                          ))}
                        {exampleDocs.filter(doc => doc.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <motion.li
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-muted-foreground"
                          >
                            Doc not here? <a href="#" className="text-orange-500 hover:underline">Insert link at the other input</a>
                          </motion.li>
                        )}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-muted p-4 rounded-md">
                  <pre className="whitespace-pre-wrap">
                    {`# Optimized LLM-ready data\n\nThis is a sample of the optimized data extracted from the website. It's ready to be used in your AI applications.`}
                  </pre>
                </div>
                <div className="flex justify-between">
                  <Button onClick={() => navigator.clipboard.writeText('# Optimized LLM-ready data...')}>
                    Copy to Clipboard
                  </Button>
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download .md
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setShowResults(false)} className="w-full">
                  Back to Search
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-2"
            >
              <p className="text-center text-muted-foreground">Processing your request...</p>
              <ul className="space-y-1">
                <li className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gathering documentation
                </li>
                <li className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning data
                </li>
                <li className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing for LLM
                </li>
              </ul>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-muted-foreground">
        <span>A PRODUCT BY</span>
        <Image src="/placeholder.svg" alt="Company Logo" width={24} height={24} />
        <span className="font-semibold">Company Name</span>
      </div>

      {showResults && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Scraped Content</h2>
          {scrapedContent.map((item, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-semibold">{item.url}</h3>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                {item.markdown}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}