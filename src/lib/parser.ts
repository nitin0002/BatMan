import { load } from "cheerio"

type MyCheerio = ReturnType<typeof load> 

export interface BatteryBasicInfo {
  computerName: string
  systemProductName: string
  bios: string
  osBuild: string
  platformRole: string
  connectedStandby: string
  reportTime: string
  installedBatteries: Array<{
    name: string
    manufacturer: string
    serialNumber: string
    chemistry: string
    designCapacity: string
    fullChargeCapacity: string
    cycleCount: string
  }>
}

// Each section can have its own interface
export interface BatteryReport {
  basicInfo: BatteryBasicInfo

  recentUsage: Array<{
    startTime: string
    state: string
    source: string
    percent: string
    remainingCapacity: string
  }>

  batteryUsage: Array<{
    startTime: string
    state: string
    duration: string
    energyDrained?: string
    energyDrained_mWh?: string
  }>

  usageHistory: Array<{
    period: string
    batteryActive: string
    batteryStandby: string
    acActive: string
    acStandby: string
  }>

  batteryCapacityHistory: Array<{
    period: string
    fullChargeCapacity: string
    designCapacity: string
  }>

  batteryLifeEstimates: Array<{
    period: string
    atFullChargeActive: string
    atFullChargeStandby: string
    atDesignActive: string
    atDesignStandby: string
  }>

  currentEstimate: {
    fullChargeActive: string
    fullChargeStandby: string
    designActive: string
    designStandby: string
  }
}

export function parseBatteryReport(html: string): BatteryReport {
  const $ = load(html)

  // Step 1: Parse Basic Info
  const basicInfo = parseBasicInfo($)

  // Step 2: Parse Recent Usage
  const recentUsage = parseRecentUsage($)

  // Step 3: Parse Battery Usage
  const batteryUsage = parseBatteryUsage($)

  // Step 4: Parse Usage History
  const usageHistory = parseUsageHistory($)

  // Step 5: Parse Battery Capacity History
  const batteryCapacityHistory = parseBatteryCapacityHistory($)

  // Step 6: Parse Battery Life Estimates
  const batteryLifeEstimates = parseBatteryLifeEstimates($)

  // Step 7: Parse Current Estimate
  const currentEstimate = parseCurrentEstimate($)

  return {
    basicInfo,
    recentUsage,
    batteryUsage,
    usageHistory,
    batteryCapacityHistory,
    batteryLifeEstimates,
    currentEstimate
  }
}

// ---------------------------
// Implement your sub-parsers below
// ---------------------------

function parseBasicInfo($: MyCheerio) {
  // We'll grab each row in the first summary table under <h1>Battery report
  // The data is in a table with label cells
  const rows = $("table")
    .first()
    .find("tr")

  const info: BatteryBasicInfo = {
    computerName: "",
    systemProductName: "",
    bios: "",
    osBuild: "",
    platformRole: "",
    connectedStandby: "",
    reportTime: "",
    installedBatteries: []
  }

  rows.each((_, row) => {
    const label = $(row).find("td.label").text().trim().toUpperCase()
    const value = $(row).find("td").not(".label").text().trim()

    switch (label) {
      case "COMPUTER NAME":
        info.computerName = value
        break
      case "SYSTEM PRODUCT NAME":
        info.systemProductName = value
        break
      case "BIOS":
        info.bios = value
        break
      case "OS BUILD":
        info.osBuild = value
        break
      case "PLATFORM ROLE":
        info.platformRole = value
        break
      case "CONNECTED STANDBY":
        info.connectedStandby = value
        break
      case "REPORT TIME":
        // Might be in <span class="date"> + <span class="time">
        info.reportTime = value
        break
    }
  })

  // Now parse installed batteries from the second table (roughly) after “Installed batteries” heading
  const batteryTable = $("h2:contains('Installed batteries')")
    .next(".explanation")
    .next("table") // <table> after explanation
  const tds = batteryTable.find("td")
  // Since it’s a small table, we can read row by row:
  const battery = {
    name: "",
    manufacturer: "",
    serialNumber: "",
    chemistry: "",
    designCapacity: "",
    fullChargeCapacity: "",
    cycleCount: ""
  }
  // Each row is <td><span class="label">NAME</span></td><td>Primary</td>
  // so we look for <span class="label"> and read next td
  batteryTable.find("tr").each((_, row) => {
    const label = $(row).find("span.label").text().trim().toUpperCase()
    const value = $(row).find("td").last().text().trim()

    switch (label) {
      case "NAME":
        battery.name = value
        break
      case "MANUFACTURER":
        battery.manufacturer = value
        break
      case "SERIAL NUMBER":
        battery.serialNumber = value
        break
      case "CHEMISTRY":
        battery.chemistry = value
        break
      case "DESIGN CAPACITY":
        battery.designCapacity = value
        break
      case "FULL CHARGE CAPACITY":
        battery.fullChargeCapacity = value
        break
      case "CYCLE COUNT":
        battery.cycleCount = value
        break
    }
  })

  info.installedBatteries.push(battery)

  return info
}

function parseRecentUsage($: MyCheerio) {
  // <h2>Recent usage</h2><div class="explanation">...
  // The table after that heading has columns: START TIME, STATE, SOURCE, CAPACITY REMAINING (2 columns)
  // Let’s grab each <tr> except the <thead>.
  const usage = new Array<{
    startTime: string
    state: string
    source: string
    percent: string
    remainingCapacity: string
  }>()

  const table = $("h2:contains('Recent usage')")
    .next(".explanation")
    .next("table")
  const rows = table.find("tr").not("thead tr").not(".noncontigbreak")

  rows.each((_, row) => {
    const tds = $(row).find("td")
    // e.g. [START TIME, STATE, SOURCE, PERCENT, REMAINING CAPACITY]
    // But watch for "AC" vs "Battery", etc.
    const startTime = tds.eq(0).text().trim()
    const state = tds.eq(1).text().trim()
    const source = tds.eq(2).text().trim()
    const percent = tds.eq(3).text().trim()
    const remainingCapacity = tds.eq(4).text().trim()

    usage.push({
      startTime,
      state,
      source,
      percent,
      remainingCapacity
    })
  })

  return usage
}

function parseBatteryUsage($: MyCheerio) {
  // <h2>Battery usage</h2><div class="explanation">...
  // Another table with START TIME, STATE, DURATION, ENERGY DRAINED
  const usage = new Array<{
    startTime: string
    state: string
    duration: string
    energyDrained?: string
    energyDrained_mWh?: string
  }>()
  const table = $("h2:contains('Battery usage')")
    .next(".explanation")
    .next("table")
  const rows = table.find("tr").not("thead tr").not(".noncontigbreak")

  rows.each((_, row) => {
    const tds = $(row).find("td")
    const startTime = tds.eq(0).text().trim()
    const state = tds.eq(1).text().trim()
    const duration = tds.eq(2).text().trim()
    // Next two columns: energy drained in % and mWh, or might be missing
    const drainedPercentOrNull = tds.eq(3).text().trim()
    const drainedMwhOrNull = tds.eq(4).text().trim()

    usage.push({
      startTime,
      state,
      duration,
      energyDrained: drainedPercentOrNull !== "-" ? drainedPercentOrNull : undefined,
      energyDrained_mWh: drainedMwhOrNull !== "-" ? drainedMwhOrNull : undefined
    })
  })
  return usage
}

function parseUsageHistory($: MyCheerio) {
  // <h2>Usage history</h2>
  // The table has columns: PERIOD, BATTERY DURATION (Active, Connected standby), then AC DURATION (Active, Connected)
  const history = new Array<{
    period: string
    batteryActive: string
    batteryStandby: string
    acActive: string
    acStandby: string
  }>()
  const table = $("h2:contains('Usage history')")
    .next(".explanation2")
    .next("table")
  const rows = table.find("tr").not("thead tr")

  rows.each((_, row) => {
    const tds = $(row).find("td")
    const period = tds.eq(0).text().trim()
    const batteryActive = tds.eq(1).text().trim()
    const batteryStandby = tds.eq(2).text().trim()
    // skip colBreak
    const acActive = tds.eq(4).text().trim()
    const acStandby = tds.eq(5).text().trim()

    history.push({
      period,
      batteryActive,
      batteryStandby,
      acActive,
      acStandby
    })
  })

  return history
}

function parseBatteryCapacityHistory($: MyCheerio) {
  // <h2>Battery capacity history</h2>
  // Table columns: PERIOD, FULL CHARGE CAPACITY, DESIGN CAPACITY
  const capacities = new Array<{
    period: string
    fullChargeCapacity: string
    designCapacity: string
  }>()
  const table = $("h2:contains('Battery capacity history')")
    .next(".explanation")
    .next("table")
  const rows = table.find("tr").not("thead tr")

  rows.each((_, row) => {
    const tds = $(row).find("td")
    const period = tds.eq(0).text().trim()
    const fullChargeCapacity = tds.eq(1).text().trim()
    const designCapacity = tds.eq(2).text().trim()

    capacities.push({ period, fullChargeCapacity, designCapacity })
  })
  return capacities
}

function parseBatteryLifeEstimates($: MyCheerio) {
  // <h2>Battery life estimates</h2>
  // Table columns: PERIOD, AT FULL CHARGE (Active/Standby), AT DESIGN CAPACITY(Active/Standby)
  const estimates = new Array<{
    period: string
    atFullChargeActive: string
    atFullChargeStandby: string
    atDesignActive: string
    atDesignStandby: string
  }>()
  const table = $("h2:contains('Battery life estimates')")
    .next(".explanation2")
    .next("table")
  const rows = table.find("tr").not("thead tr").not(".rowHeader")

  rows.each((_, row) => {
    const tds = $(row).find("td")
    const period = tds.eq(0).text().trim()
    const atFullChargeActive = tds.eq(1).text().trim()
    const atFullChargeStandby = tds.eq(2).text().trim()
    // skip colBreak
    const atDesignActive = tds.eq(4).text().trim()
    const atDesignStandby = tds.eq(5).text().trim()

    estimates.push({
      period,
      atFullChargeActive,
      atFullChargeStandby,
      atDesignActive,
      atDesignStandby
    })
  })

  return estimates
}

function parseCurrentEstimate($: MyCheerio) {
  // After battery life estimates table, there's a <div> about "Current estimate of battery life..."
  // Then a table with "Since OS install" or so.
  // We just read that single row. 
  // columns: [text], [fullChargeActive], [fullChargeStandby], colBreak, [designActive], [designStandby]
  const table = $("div.explanation2:contains('Current estimate of battery life')")
    .next("table")
  const row = table.find("tr").first()
  const tds = row.find("td")

  return {
    fullChargeActive: tds.eq(1).text().trim(),
    fullChargeStandby: tds.eq(2).text().trim(),
    designActive: tds.eq(4).text().trim(),
    designStandby: tds.eq(5).text().trim()
  }
}
