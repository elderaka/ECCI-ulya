import Papa from 'papaparse'

export interface AreaData {
  small_area: string
  year: number
  air_quality_million_gbp: number
  congestion_million_gbp: number
  hassle_costs_million_gbp: number
  physical_activity_million_gbp: number
  net_benefit_million_gbp: number
  benefit_to_hassle_ratio: number
  local_authority?: string
  nation?: string
  population?: number
  households?: number
}

export interface LookupData {
  small_area: string
  population: number
  households: number
  local_authority: string
  nation: string
}

let cachedData: AreaData[] | null = null
let cachedLookups: Map<string, LookupData> | null = null

async function loadLookups(): Promise<Map<string, LookupData>> {
  if (cachedLookups) {
    return cachedLookups
  }

  try {
    const response = await fetch('/lookups.csv')
    const csvText = await response.text()
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const lookupMap = new Map<string, LookupData>()
          results.data.forEach((row: any) => {
            lookupMap.set(row.small_area, row as LookupData)
          })
          cachedLookups = lookupMap
          console.log(`✅ Loaded ${lookupMap.size} area lookups`)
          resolve(lookupMap)
        },
        error: (error: Error) => {
          console.error('❌ Error parsing lookups CSV:', error)
          reject(error)
        }
      })
    })
  } catch (error) {
    console.error('❌ Error loading lookups CSV:', error)
    throw error
  }
}

export async function loadCSVData(): Promise<AreaData[]> {
  if (cachedData) {
    return cachedData
  }

  try {
    const [dataResponse, lookups] = await Promise.all([
      fetch('/df_wide.csv'),
      loadLookups()
    ])
    
    const csvText = await dataResponse.text()
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Join with lookups to add local_authority and nation
          cachedData = (results.data as AreaData[]).map(row => {
            const lookup = lookups.get(row.small_area)
            return {
              ...row,
              local_authority: lookup?.local_authority || 'Unknown',
              nation: lookup?.nation || 'Unknown',
              population: lookup?.population || 0,
              households: lookup?.households || 0
            }
          })
          console.log(`✅ Loaded ${cachedData.length} areas from CSV with lookup data`)
          resolve(cachedData)
        },
        error: (error: Error) => {
          console.error('❌ Error parsing CSV:', error)
          reject(error)
        }
      })
    })
  } catch (error) {
    console.error('❌ Error loading CSV:', error)
    throw error
  }
}

export function getOutliers(data: AreaData[]) {
  const highestAir = data.reduce((max, curr) => 
    curr.air_quality_million_gbp > max.air_quality_million_gbp ? curr : max
  )
  
  const highestActivity = data.reduce((max, curr) => 
    curr.physical_activity_million_gbp > max.physical_activity_million_gbp ? curr : max
  )
  
  return { highestAir, highestActivity }
}

export function sampleData(data: AreaData[], sampleSize: number, includeOutliers: AreaData[] = []) {
  // Fisher-Yates shuffle for random sampling
  const shuffled = [...data].sort(() => 0.5 - Math.random())
  const sample = shuffled.slice(0, sampleSize)
  
  // Add outliers if provided
  const outlierIds = new Set(includeOutliers.map(o => o.small_area))
  const sampleWithoutOutliers = sample.filter(d => !outlierIds.has(d.small_area))
  
  return [...sampleWithoutOutliers.slice(0, sampleSize - includeOutliers.length), ...includeOutliers]
}

export function getDeciles(data: AreaData[]) {
  const sorted = [...data].sort((a, b) => a.net_benefit_million_gbp - b.net_benefit_million_gbp)
  const decileSize = Math.floor(sorted.length / 10)
  
  const deciles = []
  for (let i = 0; i < 10; i++) {
    const start = i * decileSize
    const end = i === 9 ? sorted.length : (i + 1) * decileSize
    const decileData = sorted.slice(start, end)
    
    deciles.push({
      label: `D${i + 1}`,
      netBenefit: decileData.reduce((sum, d) => sum + d.net_benefit_million_gbp, 0) / decileData.length,
      hassleCosts: decileData.reduce((sum, d) => sum + d.hassle_costs_million_gbp, 0) / decileData.length,
      airQuality: decileData.reduce((sum, d) => sum + d.air_quality_million_gbp, 0) / decileData.length,
      physicalActivity: decileData.reduce((sum, d) => sum + d.physical_activity_million_gbp, 0) / decileData.length,
      congestion: decileData.reduce((sum, d) => sum + d.congestion_million_gbp, 0) / decileData.length,
      count: decileData.length
    })
  }
  
  return deciles
}
