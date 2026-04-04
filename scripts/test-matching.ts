/**
 * Test script for Gemini-powered mentor matching.
 * Run: npx tsx scripts/test-matching.ts
 */

// Load .env.local BEFORE any module that reads process.env
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env.local') })

import { GoogleGenerativeAI } from '@google/generative-ai'

interface MentorProfile {
  id: string
  display_name: string | null
  bio: string | null
  hashtags: string[]
  school: string | null
  credits: number
}

interface RankedMentor {
  mentor: MentorProfile
  relevanceScore: number
  reason: string
}

async function matchMentors(query: string, mentors: MentorProfile[]): Promise<RankedMentor[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a skill-based mentor matching system. Match only by skills, keywords, bio, and expertise. NEVER match by name.

Search query: "${query}"

Mentor profiles:
${JSON.stringify(mentors.map(m => ({ id: m.id, bio: m.bio, hashtags: m.hashtags, school: m.school, credits: m.credits })), null, 2)}

Return a JSON array of matched mentors ranked by relevance. Each item:
{ "mentorId": "<id>", "relevanceScore": <0.0-1.0>, "reason": "<one sentence, skill-based>" }

Rules:
- Only include mentors with relevanceScore > 0.1
- Return [] if no mentors are relevant
- Return ONLY the JSON array, no markdown`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const ranked: { mentorId: string; relevanceScore: number; reason: string }[] = JSON.parse(text)
  return ranked
    .map(r => ({ mentor: mentors.find(m => m.id === r.mentorId)!, relevanceScore: r.relevanceScore, reason: r.reason }))
    .filter(r => r.mentor != null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
}

// ── Test data ────────────────────────────────────────────────────────────────

const mentors: MentorProfile[] = [
  {
    id: 'mentor-1',
    display_name: 'Sarah Chen',
    bio: 'Senior ML engineer at a fintech startup. I specialise in NLP, transformers, and deploying models to production with MLflow and Kubernetes.',
    hashtags: ['machine-learning', 'python', 'nlp', 'kubernetes', 'mlflow'],
    school: 'MIT',
    credits: 42,
  },
  {
    id: 'mentor-2',
    display_name: 'James Okafor',
    bio: 'Full-stack engineer with 8 years of experience. I love React, TypeScript, and building scalable Node.js backends. Currently leading the platform team at a Series B SaaS.',
    hashtags: ['react', 'typescript', 'node', 'graphql', 'postgresql'],
    school: 'University of Lagos',
    credits: 31,
  },
  {
    id: 'mentor-3',
    display_name: 'Priya Sharma',
    bio: 'Product designer turned design system architect. I help teams build consistent, accessible UI component libraries from scratch.',
    hashtags: ['ui-design', 'figma', 'design-systems', 'accessibility', 'css'],
    school: 'NID Ahmedabad',
    credits: 18,
  },
  {
    id: 'mentor-4',
    display_name: 'Lucas Dupont',
    bio: 'DevOps / platform engineer. Expert in CI/CD pipelines, Terraform, AWS infrastructure, and SRE practices. Reduced deployment times by 70% at last two companies.',
    hashtags: ['devops', 'aws', 'terraform', 'ci-cd', 'docker', 'kubernetes'],
    school: 'École Polytechnique',
    credits: 27,
  },
  {
    id: 'mentor-5',
    display_name: 'Amara Diallo',
    bio: 'Blockchain developer focused on Solidity smart contracts, DeFi protocols, and Web3 security auditing.',
    hashtags: ['blockchain', 'solidity', 'web3', 'defi', 'ethereum'],
    school: 'Université de Dakar',
    credits: 9,
  },
  {
    id: 'mentor-6',
    display_name: 'Tom Watanabe',
    bio: 'iOS and Swift developer with a focus on performance, animations, and SwiftUI architecture. 6 apps on the App Store with 500k+ combined downloads.',
    hashtags: ['ios', 'swift', 'swiftui', 'mobile', 'xcode'],
    school: 'Keio University',
    credits: 22,
  },
  {
    id: 'mentor-7',
    display_name: 'Elena Rossi',
    bio: 'Data analyst and BI engineer. Proficient in SQL, dbt, Looker, and building executive dashboards. Background in retail and e-commerce analytics.',
    hashtags: ['sql', 'dbt', 'analytics', 'looker', 'data-visualization', 'python'],
    school: 'Bocconi University',
    credits: 14,
  },
]

const queries = [
  'I want to learn how to deploy machine learning models to the cloud',
  'help me build a React app with a solid backend API',
  'I need to create a design system for my startup',
  'how do I set up CI/CD and infrastructure as code on AWS',
  'I want to understand smart contracts and DeFi',
  'I am building an iPhone app and struggling with SwiftUI',
  'I want to get better at SQL and build dashboards for my team',
  'I want to get into data science and AI — where do I start?',
  'I need help with Docker and containers',
  'frontend development best practices',
]

// ── Rendering ────────────────────────────────────────────────────────────────

const R = '\x1b[0m'
const B = '\x1b[1m'
const G = '\x1b[32m'
const Y = '\x1b[33m'
const C = '\x1b[36m'
const D = '\x1b[2m'
const RE = '\x1b[31m'

function bar(score: number, width = 20): string {
  const filled = Math.round(score * width)
  return G + '█'.repeat(filled) + D + '░'.repeat(width - filled) + R
}

async function run() {
  console.log(`${B}\n Mentor Matching Test — Gemini 1.5 Flash\n${R}`)
  console.log(`${D}Mentor pool: ${mentors.length} profiles${R}\n`)
  console.log('─'.repeat(60))

  let totalMatches = 0

  for (const query of queries) {
    console.log(`\n${B}Query:${R} ${C}"${query}"${R}`)

    // Stay under 5 RPM free-tier limit for gemini-2.5-flash
    await new Promise(r => setTimeout(r, 13000))

    const start = Date.now()
    try {
      const results = await matchMentors(query, mentors)
      const elapsed = Date.now() - start

      if (results.length === 0) {
        console.log(`  ${RE}No matches found${R} ${D}(${elapsed}ms)${R}`)
      } else {
        totalMatches += results.length
        console.log(`  ${D}${results.length} match(es) · ${elapsed}ms${R}`)
        for (const r of results) {
          const name = r.mentor.display_name ?? r.mentor.id
          const tags = r.mentor.hashtags.slice(0, 3).map(t => `#${t}`).join(' ')
          console.log(
            `  ${bar(r.relevanceScore)} ${(r.relevanceScore * 100).toFixed(0).padStart(3)}%  ` +
            `${B}${name}${R}  ${D}${tags}${R}`
          )
          console.log(`    ${Y}↳${R} ${r.reason}`)
        }
      }
    } catch (err: any) {
      console.log(`  ${RE}ERROR: ${err.message}${R}`)
    }

    console.log('─'.repeat(60))
  }

  console.log(`\n${B}Summary${R}`)
  console.log(`  Queries run           : ${queries.length}`)
  console.log(`  Total matches returned: ${totalMatches}`)
  console.log(`  Avg per query         : ${(totalMatches / queries.length).toFixed(1)}\n`)
}

run().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
