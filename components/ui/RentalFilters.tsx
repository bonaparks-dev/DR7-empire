/**
 * RentalFilters — Sort and filter controls for vehicle results
 */

interface Props {
  sortBy: string
  onSortChange: (sort: string) => void
  maxBudget: number | null
  onBudgetChange: (budget: number | null) => void
  categories: string[] // available categories in results
  selectedCategories: string[]
  onCategoryChange: (cats: string[]) => void
  totalResults: number
}

const CATEGORY_LABELS: Record<string, string> = {
  SUPERCAR: 'Supercar & Luxury',
  UTILITARIA: 'Utilitarie',
  V_CLASS: 'Van & Minivan',
  FURGONE: 'Furgoni',
}

export default function RentalFilters({
  sortBy, onSortChange,
  maxBudget, onBudgetChange,
  categories, selectedCategories, onCategoryChange,
  totalResults
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3">
      {/* Results count */}
      <span className="text-sm text-gray-400 mr-2">
        {totalResults} {totalResults === 1 ? 'veicolo disponibile' : 'veicoli disponibili'}
      </span>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={e => onSortChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-white"
      >
        <option value="default">Ordine predefinito</option>
        <option value="price-asc">Prezzo piu basso</option>
        <option value="price-desc">Prezzo piu alto</option>
      </select>

      {/* Category filter (only show if multiple categories) */}
      {categories.length > 1 && (
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                if (selectedCategories.includes(cat)) {
                  onCategoryChange(selectedCategories.filter(c => c !== cat))
                } else {
                  onCategoryChange([...selectedCategories, cat])
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategories.length === 0 || selectedCategories.includes(cat)
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Budget max */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Budget max:</span>
        <input
          type="number"
          value={maxBudget ?? ''}
          onChange={e => onBudgetChange(e.target.value ? Number(e.target.value) : null)}
          placeholder="EUR"
          className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:ring-1 focus:ring-white placeholder-gray-500"
        />
      </div>
    </div>
  )
}
