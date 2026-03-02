// components/MemberContributionsClient.tsx
"use client"

import { useState } from "react"
import { toast } from "sonner"


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Plus } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Contribution {
    id: string
    fortnight: number
    date: string | null
    shares: number | null
    social_fund: number | null
    late_fee: number | null
    absent_fee: number | null
    outstanding_fee: number | null
    notes: string | null
}

interface Props {
    memberId: string
    contributions: Contribution[] | null
    grandTotal: number
    addContribution: (formData: FormData) => Promise<void>
    deleteContribution: (id: string) => Promise<void>
   
}

export function MemberContributionsClient({
    memberId,
    contributions,
    grandTotal,
    addContribution,
    deleteContribution,
}: Props) {
    const [openAdd, setOpenAdd] = useState(false)

    const handleAdd = async (formData: FormData) => {
        try {
            await addContribution(formData)
            toast.success("Contribution added successfully")
            setOpenAdd(false)
        } catch (err: any) {
            toast.error("Failed to add contribution", {
                description: err.message,
            })
        }
    }

    const handleDelete = async (id: string) => {


        try {
            await deleteContribution(id)
            toast.success("Contribution deleted")
        } catch (err: any) {
            toast.error("Failed to delete contribution", {
                description: err.message,
            })
        }
    }

    return (
        <>
            {/* Summary Card - unchanged */}
            <Card className="bg-linear-to-br from-card to-muted/40 border-border/50 shadow-2xl">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-muted-foreground">
                        Total Balance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-6xl font-bold text-center md:text-left">
                        {grandTotal.toLocaleString()}
                    </p>
                    <p className="text-lg text-muted-foreground mt-2 text-center md:text-left">
                        SBD equivalent • All fortnights
                    </p>
                </CardContent>
            </Card>

            {/* Contribution History with Add Modal */}
            <Card className="border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Contribution History</CardTitle>

                    <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add Contribution
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-150">
                            <DialogHeader>
                                <DialogTitle>Add New Contribution</DialogTitle>
                            </DialogHeader>
                            <form action={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <input type="hidden" name="memberId" value={memberId} />

                                <div className="space-y-2">
                                    <Label htmlFor="fortnight">Fortnight (1-23)</Label>
                                    <Input name="fortnight" type="number" min="1" max="23" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input name="date" type="date" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shares">Shares</Label>
                                    <Input name="shares" type="number" min="0" step="0.01" defaultValue="0" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="social_fund">Social Fund</Label>
                                    <Input name="social_fund" type="number" min="0" step="0.01" defaultValue="0" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="late_fee">Late Fee</Label>
                                    <Input name="late_fee" type="number" min="0" step="0.01" defaultValue="0" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="absent_fee">Absent Fee</Label>
                                    <Input name="absent_fee" type="number" min="0" step="0.01" defaultValue="0" required />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="notes">Notes (optional)</Label>
                                    <Input name="notes" />
                                </div>

                                <DialogFooter className="md:col-span-2">
                                    <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                                        Save Contribution
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

          
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-16">FN</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Shares</TableHead>
                                    <TableHead className="text-right">Social</TableHead>
                                    <TableHead className="text-right">Late</TableHead>
                                    <TableHead className="text-right">Absent</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                    <TableHead className="text-right">Row Total</TableHead>
                                    <TableHead className="text-right">Cumulative</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(() => {
                                    let cumulativeTotal = 0
                                    return contributions?.map((row) => {
                                        const rowTotal =
                                            (row.shares ?? 0) +
                                            (row.social_fund ?? 0)
                                        cumulativeTotal += rowTotal

                                        return (
                                            <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">{row.fortnight}</TableCell>
                                                <TableCell>{row.date || '—'}</TableCell>
                                                <TableCell className="text-right">{row.shares || 0}</TableCell>
                                                <TableCell className="text-right text-emerald-400">{row.social_fund || 0}</TableCell>
                                                <TableCell className="text-right text-red-400">{row.late_fee || 0}</TableCell>
                                                <TableCell className="text-right text-red-400">{row.absent_fee || 0}</TableCell>
                                                <TableCell className="text-right text-red-400">{row.outstanding_fee || 0}</TableCell>
                                                <TableCell className="text-right font-medium">{rowTotal}</TableCell>
                                                <TableCell className="text-right font-bold text-cyan-300">
                                                    {cumulativeTotal}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">{row.notes || '—'}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {/* <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                            </Button> */}
                                                    {/* Delete Confirmation Modal */}
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Contribution</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this contribution for fortnight {row.fortnight}?
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(row.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                })()}

                                {(!contributions || contributions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                                            No contributions yet for this member
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}