import { HabitEvent } from "@/app/dashboard/page"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  
 
  
  export function EventTable({eventData, toggle, selected, }: { eventData: HabitEvent, toggle: (id: string) => void, selected: [], }) {

    
    return (
      <div>
      <Table className='text-1xl '>
  
        <TableCaption> Recent Events.</TableCaption>
        <TableHeader className=''>
          <TableRow className=''>
           <TableCell>Select</TableCell>
           <TableCell>Type</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody >
          {eventData.map((event) => (
            <TableRow key={event.id} className="" >
                <input className='mx-7 my-3 w-5 h-5'
                  type="checkbox"
                  checked={selected.includes(event.id)}
                  onChange={() => toggle(event.id)}
                />
              
             
              <TableCell>   <span
          className={
            event.type === "hit"
              ? "text-green-300 font-bold"
              : "text-red-400 font-bold"
          }
        >
          {event.type}
        </span></TableCell>
            
  
              <TableCell className="text-center">
                {eventData.timestamp}
              </TableCell>
             
            </TableRow>
          ))}
        </TableBody>
       
      </Table>
      </div>
    )
  }
  