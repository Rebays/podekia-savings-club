import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch contributions – adjust table/column names to match your schema
  const { data: contributions, error } = await supabase
    .from('Contributions')
    .select(`
      fortnight,
      date,
      shares,
      social_fund,
      late_fee,
      absent_fee,
      notes
    `)
    .eq('member_id', user.id)           // assuming member_id = auth.uid()
    .order('fortnight', { ascending: true })

  if (error) {
    console.error('Error fetching contributions:', error)
    return (
      <div className="p-8 text-red-600">
        Error loading your data. Please try again later.
      </div>
    )
  }

  // Calculate totals
  const totals = contributions?.reduce(
    (acc, row) => ({
      shares: acc.shares + (row.shares || 0),
      social: acc.social + (row.social_fund || 0),
      late: acc.late + (row.late_fee || 0),
      absent: acc.absent + (row.absent_fee || 0),
    }),
    { shares: 0, social: 0, late: 0, absent: 0 }
  ) ?? { shares: 0, social: 0, late: 0, absent: 0 }

  const grandTotal = totals.shares + totals.social + totals.late + totals.absent

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {user.email}
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-gray-50">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Shares</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.shares}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Social Fund</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.social}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Late Fees</p>
              <p className="text-2xl font-semibold text-red-600">{totals.late}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Absent Fees</p>
              <p className="text-2xl font-semibold text-red-600">{totals.absent}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
              <p className="text-sm text-blue-700 font-medium">Grand Total</p>
              <p className="text-3xl font-bold text-blue-800">{grandTotal}</p>
            </div>
          </div>

          {/* Contributions table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Social
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions?.map((row) => (
                  <tr key={row.fortnight} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.fortnight}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.date || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {row.shares || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {row.social_fund || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {row.late_fee || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {row.absent_fee || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {row.notes || '—'}
                    </td>
                  </tr>
                ))}

                {(!contributions || contributions.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No contributions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Logged in as {user.email}
        </div>
      </div>
    </div>
  )
}