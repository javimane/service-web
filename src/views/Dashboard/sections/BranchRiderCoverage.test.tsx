import { render,screen } from '@testing-library/react';
import { describe,it,expect } from 'vitest';
import { BranchRiderCoverage } from './BranchRiderCoverage';
const coverage={location_id:'branch',configured:true,total_riders:3,online_riders:1,by_vehicle:[{vehicle_type:'bicycle',total:2,online:0},{vehicle_type:'motorcycle',total:1,online:1}]};
describe('Branch rider coverage',()=>{
 it('shows the count by vehicle and distinguishes connected riders',()=>{
  render(<BranchRiderCoverage coverage={coverage} loading={false} error={false}/>);
  expect(screen.getByText('3 habilitados · 1 conectados')).toBeInTheDocument();
  expect(screen.getByText('Bicicleta')).toBeInTheDocument();expect(screen.getByText('2 · 0 conectados')).toBeInTheDocument();
  expect(screen.getByText('Moto')).toBeInTheDocument();expect(screen.getByText('1 · 1 conectados')).toBeInTheDocument();
 });
 it('does not show a lookup failure as zero riders',()=>{
  render(<BranchRiderCoverage coverage={coverage} loading={false} error/>);
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudo consultar');expect(screen.queryByText(/0 habilitados/)).not.toBeInTheDocument();
 });
 it('warns that there is no coverage and provides alternatives',()=>{
  render(<BranchRiderCoverage coverage={{...coverage,total_riders:0,online_riders:0,by_vehicle:[]}} loading={false} error={false}/>);
  expect(screen.getByRole('status')).toHaveTextContent('No hay riders de Sercio habilitados');
 });
 it('asks for the area before offering a count',()=>{
  render(<BranchRiderCoverage coverage={{...coverage,configured:false}} loading={false} error={false}/>);
  expect(screen.getByText(/Completá la provincia y el departamento/)).toBeInTheDocument();expect(screen.queryByText(/3 habilitados/)).not.toBeInTheDocument();
 });
});
