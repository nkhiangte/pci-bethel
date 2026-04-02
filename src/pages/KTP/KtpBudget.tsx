import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, FileDown, Loader } from 'lucide-react';
import { db } from '../../services/firebase';
import { KTPBudget, BudgetItem } from '../../types';

const KtpBudgetComponent: React.FC = () => {
  const [data, setData] = useState<KTPBudget | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!db?.collection) return;
    try {
      const budgetDoc = await db.collection('ktpBudget').doc('2026').get();
      if (budgetDoc.exists) setData(budgetDoc.data() as KTPBudget);
    } catch (e) { console.error("Error fetching KTP data:", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>;
  if (!data) return <div className="p-8 bg-white rounded-xl shadow-sm text-center">No budget data available.</div>;

  const calculateTotal = (items: BudgetItem[]) => items.reduce((sum, item) => sum + parseFloat(item.amount.replace(/,/g, '')), 0);

  const totalIncome = calculateTotal(data.income);
  const totalExpenditure = calculateTotal(data.expenditure);
  const balance = totalIncome - totalExpenditure;

  const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`;

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Project & Budget {data.year}</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2"><TrendingUp size={20}/> Estimated Income</h3>
          <div className="space-y-2 text-sm">
            {data.income.map((item) => (
              <div key={item.id} className="flex justify-between p-2 rounded hover:bg-green-50">
                <span className="text-slate-700">{item.item}</span>
                <span className="font-mono font-semibold text-slate-800">{formatCurrency(parseFloat(item.amount.replace(/,/g, '')))}</span>
              </div>
            ))}
            <div className="flex justify-between p-2 mt-4 border-t-2 border-green-200 font-bold">
              <span className="text-green-800">Total Income</span>
              <span className="font-mono text-green-800">{formatCurrency(totalIncome)}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2"><FileDown size={20}/> Estimated Expenditure</h3>
          <div className="space-y-2 text-sm">
            {data.expenditure.map((item) => (
              <div key={item.id} className="flex justify-between p-2 rounded hover:bg-red-50">
                <span className="text-slate-700">{item.item}</span>
                <span className="font-mono font-semibold text-slate-800">{formatCurrency(parseFloat(item.amount.replace(/,/g, '')))}</span>
              </div>
            ))}
            <div className="flex justify-between p-2 mt-4 border-t-2 border-red-200 font-bold">
              <span className="text-red-800">Total Expenditure</span>
              <span className="font-mono text-red-800">{formatCurrency(totalExpenditure)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
           <div className={`p-4 rounded-lg flex items-center justify-between w-full md:w-1/2 ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>Balance</span>
              <span className={`text-2xl font-mono font-black ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(balance)}</span>
           </div>
      </div>
    </div>
  );
};

export default KtpBudgetComponent;
