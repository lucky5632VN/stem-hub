import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Theory from './pages/Theory';
import Exercises from './pages/Exercises';
import VirtualLab from './pages/VirtualLab';
import AnatomyLab from './pages/labs/AnatomyLab';
import CranialCTScanLab from './pages/labs/CranialCTScanLab';
import BrainSectionsLab from './pages/labs/BrainSectionsLab';
import BoneScintigraphyLab from './pages/labs/BoneScintigraphyLab';
import SpinalCordLab from './pages/labs/SpinalCordLab';
import HumanBrainLab from './pages/labs/HumanBrainLab';
import MendelLab from './pages/labs/MendelLab';
import MendelDiHybridLab from './pages/labs/MendelDiHybridLab';
import SenseOfTasteLab from './pages/labs/SenseOfTasteLab';
import UrinarySystemLab from './pages/labs/UrinarySystemLab';
import DigestiveTractLab from './pages/labs/DigestiveTractLab';
import MuscleContractionLab from './pages/labs/MuscleContractionLab';
import MaleReproductiveLab from './pages/labs/MaleReproductiveLab';
import RespiratorySystemLab from './pages/labs/RespiratorySystemLab';
import FemaleReproductiveLab from './pages/labs/FemaleReproductiveLab';
import FoodNetworkLab from './pages/labs/FoodNetworkLab';
import MountainFoodChainLab from './pages/labs/MountainFoodChainLab';
import KaryotypeLab from './pages/labs/KaryotypeLab';
import TheTreeLab from './pages/labs/TheTreeLab';
import RootAbsorptionLab from './pages/labs/RootAbsorptionLab';
import FertilizationLab from './pages/labs/FertilizationLab';
import Chatbot from './components/Chatbot';

// Force HMR Rebuild
function App() {
  return (
    <HashRouter>
      <Chatbot />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="theory" element={<Theory />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="virtual-lab" element={<VirtualLab />} />
        </Route>
        <Route path="/virtual-lab/anatomy" element={<AnatomyLab />} />
        <Route path="/virtual-lab/ct-scan" element={<CranialCTScanLab />} />
        <Route path="/virtual-lab/brain-sections" element={<BrainSectionsLab />} />
        <Route path="/virtual-lab/bone-scintigraphy" element={<BoneScintigraphyLab />} />
        <Route path="/virtual-lab/spinal-cord" element={<SpinalCordLab />} />
        <Route path="/virtual-lab/human-brain" element={<HumanBrainLab />} />
        <Route path="/virtual-lab/taste" element={<SenseOfTasteLab />} />
        <Route path="/virtual-lab/urinary-system" element={<UrinarySystemLab />} />
        <Route path="/virtual-lab/digestive-tract" element={<DigestiveTractLab />} />
        <Route path="/virtual-lab/muscle-contraction" element={<MuscleContractionLab />} />
        <Route path="/virtual-lab/respiratory-system" element={<RespiratorySystemLab />} />
        <Route path="/virtual-lab/male-reproductive" element={<MaleReproductiveLab />} />
        <Route path="/virtual-lab/female-reproductive" element={<FemaleReproductiveLab />} />
        <Route path="/virtual-lab/food-network" element={<FoodNetworkLab />} />
        <Route path="/virtual-lab/mountain-food-chain" element={<MountainFoodChainLab />} />
        <Route path="/virtual-lab/karyotype-activities" element={<KaryotypeLab />} />
        <Route path="/virtual-lab/the-tree" element={<TheTreeLab />} />
        <Route path="/virtual-lab/root-absorption" element={<RootAbsorptionLab />} />
        <Route path="/virtual-lab/fertilization" element={<FertilizationLab />} />
        <Route path="/virtual-lab/mendel-experiment" element={<MendelLab />} />
        <Route path="/virtual-lab/mendel-di-hybrid" element={<MendelDiHybridLab />} />



      </Routes>
    </HashRouter>
  );
}

export default App;
