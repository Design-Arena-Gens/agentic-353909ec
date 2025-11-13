'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

interface FieldConfig {
  name: string
  searchQuery: string
  enabled: boolean
}

export default function Home() {
  const [fields, setFields] = useState<FieldConfig[]>(() => {
    const defaultFields = [
      'Company Name', 'Website', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP Code',
      'Country', 'Industry', 'Description', 'Founded Year', 'Employee Count', 'Revenue',
      'CEO Name', 'Contact Person', 'Job Title', 'Department', 'LinkedIn', 'Twitter',
      'Facebook', 'Instagram', 'Annual Revenue', 'Market Cap', 'Stock Symbol', 'Headquarters',
      'Parent Company', 'Subsidiaries', 'Products', 'Services', 'Competitors', 'Technology Stack',
      'Customer Base', 'Key Clients', 'Partnerships', 'Certifications', 'Awards', 'News'
    ]
    return defaultFields.map(name => ({
      name,
      searchQuery: '',
      enabled: true
    }))
  })

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState<any[]>([])

  const handleFieldChange = (index: number, key: keyof FieldConfig, value: string | boolean) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], [key]: value }
    setFields(newFields)
  }

  const addField = () => {
    setFields([...fields, { name: '', searchQuery: '', enabled: true }])
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const searchAndFill = async () => {
    setLoading(true)
    setProgress('Starting search...')
    setResults([])

    const enabledFields = fields.filter(f => f.enabled && f.name)
    const searchResults: any = {}

    for (let i = 0; i < enabledFields.length; i++) {
      const field = enabledFields[i]
      setProgress(`Searching ${i + 1}/${enabledFields.length}: ${field.name}`)

      try {
        const query = field.searchQuery || field.name
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })

        const data = await response.json()
        searchResults[field.name] = data.result || 'No data found'
      } catch (error) {
        searchResults[field.name] = 'Error fetching data'
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setResults([searchResults])
    setProgress('Search completed!')
    setLoading(false)
  }

  const downloadExcel = () => {
    if (results.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(results)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `filled_data_${Date.now()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const uploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[]
        const newFields = headers.map(name => ({
          name: String(name),
          searchQuery: '',
          enabled: true
        }))
        setFields(newFields)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-indigo-600">
            Excel Auto Filler
          </h1>
          <p className="text-center text-gray-600 mb-8">
            AI-powered internet search to automatically fill your Excel fields
          </p>

          <div className="mb-6 flex gap-4 justify-center">
            <label className="bg-indigo-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-indigo-600 transition">
              Upload Excel Template
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={uploadExcel}
                className="hidden"
              />
            </label>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Fields to Search ({fields.filter(f => f.enabled).length} enabled)
              </h2>
              <button
                onClick={addField}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                + Add Field
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {fields.map((field, index) => (
                <div key={index} className="flex gap-2 mb-3 items-center">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(e) => handleFieldChange(index, 'enabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                    placeholder="Field name"
                    className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="text"
                    value={field.searchQuery}
                    onChange={(e) => handleFieldChange(index, 'searchQuery', e.target.value)}
                    placeholder="Custom search query (optional)"
                    className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => removeField(index)}
                    className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={searchAndFill}
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="loader"></div>}
              {loading ? 'Searching...' : 'Search & Fill'}
            </button>

            {results.length > 0 && (
              <button
                onClick={downloadExcel}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Download Excel
              </button>
            )}
          </div>

          {progress && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
              {progress}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Results Preview</h3>
              <div className="overflow-x-auto max-h-96 border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {Object.keys(results[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val: any, i) => (
                          <td key={i} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {String(val).substring(0, 100)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">How to Use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Upload an existing Excel template or use the default 38 fields</li>
            <li>Customize field names and add custom search queries if needed</li>
            <li>Enable/disable specific fields using checkboxes</li>
            <li>Click "Search & Fill" to automatically search the internet for each field</li>
            <li>Preview the results and download the filled Excel file</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
