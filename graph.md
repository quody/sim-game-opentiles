```mermaid
flowchart TB
%% ==========================================
%% STYLING
%% ==========================================
classDef resource fill:#4a7c59,stroke:#2d4a35,color:#fff
classDef processing fill:#c17f59,stroke:#8b5a3c,color:#fff
classDef tool fill:#4a6fa5,stroke:#2d4266,color:#fff
classDef facility fill:#8b6914,stroke:#5c4a0f,color:#fff
classDef hobbit fill:#7cb342,stroke:#558b2f,color:#fff
classDef dwarf fill:#78909c,stroke:#546e7a,color:#fff
classDef men fill:#ab7b4a,stroke:#7a5533,color:#fff

%% ==========================================
%% PRIMARY RESOURCES
%% ==========================================
subgraph LAND["⛰️ PRIMARY RESOURCES"]
    direction TB
    
    subgraph Mining["Mining · Dwarf Domain"]
        IronOre[Iron Ore]:::resource
        CopperOre[Copper Ore]:::resource
        TinOre[Tin Ore]:::resource
        GoldOre[Gold Ore]:::resource
        SilverOre[Silver Ore]:::resource
        Coal[Coal]:::resource
        Gemstones[Raw Gemstones]:::resource
        Stone[Quarried Stone]:::resource
        Clay[Clay]:::resource
        Sand[Silica Sand]:::resource
    end

    subgraph Forestry["Forestry · Men Domain"]
        OakLogs[Oak Logs]:::resource
        AshLogs[Ash Logs]:::resource
        YewLogs[Yew Logs]:::resource
        WillowBark[Willow Bark]:::resource
        TreeResin[Tree Resin]:::resource
        WildGame[Wild Game]:::resource
        Pelts[Animal Pelts]:::resource
        Feathers[Feathers]:::resource
        Beeswax[Wild Beeswax]:::resource
        WildHerbs[Wild Herbs]:::resource
    end

    subgraph Agriculture["Agriculture · Hobbit Domain"]
        Wheat[Wheat]:::resource
        Barley[Barley]:::resource
        Oats[Oats]:::resource
        Apples[Apples]:::resource
        Pears[Pears]:::resource
        Grapes[Grapes]:::resource
        Plums[Plums]:::resource
        Potatoes[Potatoes]:::resource
        Carrots[Carrots]:::resource
        Onions[Onions]:::resource
        Cabbages[Cabbages]:::resource
        Mushrooms[Mushrooms]:::resource
        PipeWeed[Pipe-Weed]:::resource
        HerbGarden[Garden Herbs]:::resource
        Hops[Hops]:::resource
        Honey[Honey]:::resource
    end

    subgraph Husbandry["Animal Husbandry"]
        Cattle[Cattle]:::resource
        Sheep[Sheep]:::resource
        Pigs[Pigs]:::resource
        Goats[Goats]:::resource
        Chickens[Chickens]:::resource
        Geese[Geese]:::resource
        MilkRaw[Fresh Milk]:::resource
        Eggs[Eggs]:::resource
        Wool[Raw Wool]:::resource
    end
end

%% ==========================================
%% TOOLS & FACILITIES
%% ==========================================
subgraph TOOLS["🔧 TOOLS & FACILITIES"]
    direction TB
    
    subgraph MetalTools["Smithing Tools"]
        Anvil[Anvil]:::tool
        SmithHammer[Smith Hammer]:::tool
        Tongs[Forge Tongs]:::tool
        Bellows[Bellows]:::tool
        Crucible[Crucible]:::tool
        DrawPlate[Draw Plate]:::tool
        FilesRasps[Files]:::tool
        Chisel[Chisel]:::tool
        QuenchTrough[Quench Trough]:::tool
        GrindWheel[Grinding Wheel]:::tool
        PolishWheel[Polishing Wheel]:::tool
        DieCutter[Die Cutter]:::tool
        CoinPress[Coin Press]:::tool
        Scales[Precision Scales]:::tool
        Weights[Calibrated Weights]:::tool
    end

    subgraph WoodTools["Woodworking Tools"]
        WoodAxe[Felling Axe]:::tool
        Saw[Crosscut Saw]:::tool
        Plane[Plane]:::tool
        WoodChisel[Wood Chisel]:::tool
        Lathe[Foot Lathe]:::tool
        Clamps[Clamps]:::tool
        Mallet[Mallet]:::tool
        DrawKnife[Draw Knife]:::tool
    end

    subgraph FarmTools["Farm Tools"]
        Plough[Iron Plough]:::tool
        Scythe[Scythe]:::tool
        Sickle[Sickle]:::tool
        Hoe[Hoe]:::tool
        Rake[Rake]:::tool
        Pitchfork[Pitchfork]:::tool
        Flail[Flail]:::tool
        Winnow[Winnowing Basket]:::tool
    end

    subgraph MiningTools["Mining Tools"]
        Pickaxe[Pickaxe]:::tool
        MiningHammer[Mining Hammer]:::tool
        Wedges[Iron Wedges]:::tool
        Lantern[Mining Lantern]:::tool
        OreCart[Ore Cart]:::tool
        Sieve[Ore Sieve]:::tool
    end

    subgraph KitchenTools["Kitchen Tools"]
        CookPot[Cook Pot]:::tool
        Cauldron[Cauldron]:::tool
        Skillet[Skillet]:::tool
        Spit[Roasting Spit]:::tool
        KitchenKnife[Kitchen Knives]:::tool
        Cleaver[Cleaver]:::tool
        RollingPin[Rolling Pin]:::tool
        MixingBowls[Mixing Bowls]:::tool
        Mortar[Mortar & Pestle]:::tool
        ButterChurn[Butter Churn]:::tool
        CheeseMold[Cheese Mold]:::tool
        SausageFunnel[Sausage Funnel]:::tool
        PreservingJar[Preserving Jars]:::tool
        BakingTins[Baking Tins]:::tool
        PieDish[Pie Dishes]:::tool
    end

    subgraph LeatherTools["Leather Tools"]
        TanningRack[Tanning Rack]:::tool
        FleshingKnife[Fleshing Knife]:::tool
        Awl[Awl]:::tool
        StitchPony[Stitching Pony]:::tool
    end

    subgraph WritingTools["Writing Tools"]
        QuillPen[Quill Pen]:::tool
        InkWell[Ink Well]:::tool
        WaxSeal[Wax Seal]:::tool
        BookPress[Book Press]:::tool
    end

    subgraph Facilities["Production Facilities"]
        Forge[Forge]:::facility
        Smelter[Smelter]:::facility
        Furnace[Blast Furnace]:::facility
        Bloomery[Bloomery]:::facility
        Foundry[Foundry]:::facility
        Mill[Grist Mill]:::facility
        Bakery[Bakery Oven]:::facility
        Brewery[Brewery]:::facility
        Distillery[Distillery]:::facility
        Smokehouse[Smokehouse]:::facility
        DairyHouse[Dairy House]:::facility
        Kitchen[Great Kitchen]:::facility
        CellarStore[Root Cellar]:::facility
        WineCellar[Wine Cellar]:::facility
        Sawpit[Sawpit]:::facility
        Carpentry[Carpentry Shop]:::facility
        CooperShop[Cooperage]:::facility
        Tannery[Tannery]:::facility
        Mint[Royal Mint]:::facility
        Vault[Vault]:::facility
        CountingHouse[Counting House]:::facility
        GlassWorks[Glassworks]:::facility
        Kiln[Potter's Kiln]:::facility
        Scriptorium[Scriptorium]:::facility
    end
end

%% ==========================================
%% MATERIAL PROCESSING
%% ==========================================
subgraph PROCESSING["⚙️ MATERIAL PROCESSING"]
    direction TB
    
    subgraph MetalProcess["Metal Processing"]
        IronBloom[Iron Bloom]:::processing
        WroughtIron[Wrought Iron]:::processing
        CastIron[Cast Iron]:::processing
        Steel[Steel]:::processing
        DwarfSteel[Dwarf-Steel]:::processing
        Bronze[Bronze]:::processing
        Brass[Brass]:::processing
        GoldIngot[Gold Ingot]:::processing
        SilverIngot[Silver Ingot]:::processing
        CopperIngot[Copper Ingot]:::processing
        GoldSheet[Gold Leaf]:::processing
        SilverSheet[Silver Sheet]:::processing
        GoldWire[Gold Wire]:::processing
        SilverWire[Silver Wire]:::processing
        CutGems[Cut Gems]:::processing
        PolishedGems[Polished Gems]:::processing
    end

    subgraph WoodProcess["Wood Processing"]
        Planks[Sawn Planks]:::processing
        Boards[Finished Boards]:::processing
        Staves[Barrel Staves]:::processing
        Dowels[Dowels]:::processing
        TurnedWood[Turned Wood]:::processing
        Charcoal[Charcoal]:::processing
    end

    subgraph LeatherProcess["Leather Processing"]
        RawHide[Raw Hide]:::processing
        TannedLeather[Tanned Leather]:::processing
        CuredLeather[Cured Leather]:::processing
        HardLeather[Hardened Leather]:::processing
        TooledLeather[Tooled Leather]:::processing
        Vellum[Vellum]:::processing
        Parchment[Parchment]:::processing
    end

    subgraph TextileProcess["Textile Processing"]
        SpunWool[Spun Wool]:::processing
        WovenCloth[Woven Cloth]:::processing
        FeltedWool[Felted Wool]:::processing
    end

    subgraph FoodProcess["Food Processing"]
        Flour[Wheat Flour]:::processing
        OatMeal[Oat Meal]:::processing
        BarleyMalt[Barley Malt]:::processing
        Yeast[Yeast]:::processing
        Butter[Butter]:::processing
        Cream[Cream]:::processing
        Curds[Cheese Curds]:::processing
        Lard[Lard]:::processing
        Tallow[Tallow]:::processing
        SaltedMeat[Salted Meat]:::processing
        SmokedMeat[Smoked Meat]:::processing
        Sausage[Sausage]:::processing
        Bacon[Bacon]:::processing
        Ham[Cured Ham]:::processing
        DriedFruit[Dried Fruit]:::processing
        FruitPreserve[Fruit Preserves]:::processing
        PickledVeg[Pickled Vegetables]:::processing
        HerbBundle[Dried Herbs]:::processing
        SpiceMix[Spice Blends]:::processing
        Stock[Bone Stock]:::processing
        Pastry[Pastry Dough]:::processing
        Custard[Custard]:::processing
        CuredPipeWeed[Cured Pipe-Weed]:::processing
    end

    subgraph ChemProcess["Chemical Processing"]
        TannicAcid[Tannic Extract]:::processing
        Ink[Ink]:::processing
        Pigments[Pigments]:::processing
        Glue[Hide Glue]:::processing
        Oil[Lamp Oil]:::processing
        Wax[Refined Wax]:::processing
    end

    subgraph GlassCeramic["Glass & Ceramic"]
        ClearGlass[Clear Glass]:::processing
        FiredClay[Fired Clay]:::processing
        Stoneware[Stoneware]:::processing
    end
end

%% ==========================================
%% HOBBIT CULINARY ARTS
%% ==========================================
subgraph HOBBITFOOD["🥧 HOBBIT CULINARY ARTS"]
    direction TB
    
    subgraph Breads["Breads & Baked Goods"]
        Loaf[Crusty Loaf]:::hobbit
        SeedBread[Seven-Seed Bread]:::hobbit
        HoneyBread[Honey Bread]:::hobbit
        OatCakes[Oat Cakes]:::hobbit
        Scones[Cream Scones]:::hobbit
        Muffins[Berry Muffins]:::hobbit
        Biscuits[Butter Biscuits]:::hobbit
        Rolls[Dinner Rolls]:::hobbit
    end

    subgraph Pastries["Pastries & Pies"]
        MeatPie[Meat Pie]:::hobbit
        PorkPie[Pork Pie]:::hobbit
        ChickenPie[Chicken Pie]:::hobbit
        ShepherdPie[Shepherd's Pie]:::hobbit
        ApplePie[Apple Pie]:::hobbit
        PearTart[Pear Tart]:::hobbit
        CustardTart[Custard Tart]:::hobbit
        SeedCake[Seed Cake]:::hobbit
        FruitCake[Fruit Cake]:::hobbit
        HoneyCake[Honey Cake]:::hobbit
    end

    subgraph Cheeses["Cheeses"]
        SoftCheese[Soft Cheese]:::hobbit
        AgedCheddar[Aged Cheddar]:::hobbit
        BlueCheese[Blue Cheese]:::hobbit
        GoatCheese[Goat Cheese]:::hobbit
        SmokedCheese[Smoked Cheese]:::hobbit
        HerbCheese[Herb Cheese]:::hobbit
        WaxedWheel[Waxed Wheel]:::hobbit
    end

    subgraph Drinks["Beverages"]
        Ale[Hobbit Ale]:::hobbit
        StrongAle[Strong Ale]:::hobbit
        DarkPorter[Dark Porter]:::hobbit
        AppleCider[Apple Cider]:::hobbit
        PearPerry[Pear Perry]:::hobbit
        Mead[Golden Mead]:::hobbit
        BerryWine[Berry Wine]:::hobbit
        GrapeWine[Grape Wine]:::hobbit
        Brandy[Fruit Brandy]:::hobbit
        HerbTea[Herb Tea]:::hobbit
    end

    subgraph Preserved["Preserved Foods"]
        JamJar[Fruit Jams]:::hobbit
        Marmalade[Marmalade]:::hobbit
        Pickles[Pickled Onions]:::hobbit
        Chutney[Apple Chutney]:::hobbit
        PottedMeat[Potted Meat]:::hobbit
        Confit[Duck Confit]:::hobbit
    end

    subgraph Prepared["Prepared Dishes"]
        Stew[Hearty Stew]:::hobbit
        Roast[Sunday Roast]:::hobbit
        Sausages[Breakfast Sausages]:::hobbit
        BlackPudding[Black Pudding]:::hobbit
        FriedMushrooms[Fried Mushrooms]:::hobbit
        PotatoCakes[Potato Cakes]:::hobbit
        Gravy[Rich Gravy]:::hobbit
    end

    subgraph Tobacco["Pipe-Weed"]
        LongBottom[Longbottom Leaf]:::hobbit
        OldToby[Old Toby]:::hobbit
        SouthernStar[Southern Star]:::hobbit
    end
end

%% ==========================================
%% DWARF SWORD-CRAFT
%% ==========================================
subgraph DWARFSWORD["⚔️ DWARF SWORD-CRAFT"]
    direction TB
    
    subgraph BladeWork["Blade Forging"]
        RoughBlade[Rough Blade]:::dwarf
        ShapedBlade[Shaped Blade]:::dwarf
        TemperedBlade[Tempered Blade]:::dwarf
        GroundBlade[Ground Blade]:::dwarf
        PolishedBlade[Polished Blade]:::dwarf
        MasterBlade[Master Blade]:::dwarf
        PatternWeld[Pattern-Weld]:::dwarf
        DamascusBlade[Damascus Blade]:::dwarf
    end

    subgraph HiltWork["Hilt Components"]
        TangFit[Fitted Tang]:::dwarf
        CrossGuard[Cross Guard]:::dwarf
        Quillon[Quillons]:::dwarf
        Pommel[Pommel]:::dwarf
        GripCore[Grip Core]:::dwarf
        LeatherWrap[Leather Wrap]:::dwarf
        WireWrap[Wire Wrap]:::dwarf
        DecorativeGuard[Decorated Guard]:::dwarf
        JeweledPommel[Jeweled Pommel]:::dwarf
    end

    subgraph Scabbard["Scabbards"]
        WoodCore[Scabbard Core]:::dwarf
        LeatherSheath[Leather Sheath]:::dwarf
        MetalThroat[Metal Throat]:::dwarf
        Chape[Chape]:::dwarf
        BeltLoop[Belt Loop]:::dwarf
        DecoratedScabbard[Decorated Scabbard]:::dwarf
        MasterScabbard[Master Scabbard]:::dwarf
    end

    subgraph FinishedSwords["Finished Swords"]
        Shortsword[Shortsword]:::dwarf
        Longsword[Longsword]:::dwarf
        Broadsword[Broadsword]:::dwarf
        Bastard[Bastard Sword]:::dwarf
        Greatsword[Greatsword]:::dwarf
        Falchion[Falchion]:::dwarf
        Rapier[Rapier]:::dwarf
        CeremonialBlade[Ceremonial Blade]:::dwarf
        RuneBlade[Rune-Marked Blade]:::dwarf
        KingsBlade[King's Blade]:::dwarf
        AncestorBlade[Ancestor Blade]:::dwarf
    end

    subgraph Maintenance["Maintenance"]
        SwordOil[Blade Oil]:::dwarf
        PolishCloth[Polish Cloth]:::dwarf
        SharpenStone[Sharpening Stone]:::dwarf
        RepairKit[Repair Kit]:::dwarf
    end
end

%% ==========================================
%% BANKING & COMMERCE
%% ==========================================
subgraph MENBANK["🏦 BANKING & COMMERCE"]
    direction TB
    
    subgraph Coinage["Coinage"]
        CopperCoin[Copper Pennies]:::men
        SilverCoin[Silver Shillings]:::men
        GoldCrown[Gold Crowns]:::men
        TradeBars[Trade Bars]:::men
        MerchantToken[Merchant Tokens]:::men
        GuildMedal[Guild Medallions]:::men
    end

    subgraph Documents["Financial Documents"]
        Ledger[Account Ledger]:::men
        DeedTitle[Property Deed]:::men
        BondPaper[Promissory Bond]:::men
        TradeContract[Trade Contract]:::men
        LetterCredit[Letter of Credit]:::men
        BillLading[Bill of Lading]:::men
        InsuranceWrit[Insurance Writ]:::men
        TaxRecord[Tax Records]:::men
        WillTestament[Will & Testament]:::men
        GuildCharter[Guild Charter]:::men
        RoyalWrit[Royal Writ]:::men
        MerchantLicense[Merchant License]:::men
    end

    subgraph Securities["Security Items"]
        Strongbox[Iron Strongbox]:::men
        VaultDoor[Vault Door]:::men
        LockBox[Lock Box]:::men
        KeySet[Master Keys]:::men
        WaxSeals[Official Seals]:::men
        SignetRing[Signet Ring]:::men
        CipherBook[Cipher Book]:::men
    end

    subgraph MeasureValue["Measures & Values"]
        GoldScales[Gold Scales]:::men
        GemLoupe[Gem Loupe]:::men
        CountingBoard[Counting Board]:::men
        Abacus[Abacus]:::men
        StandardWeights[Standard Weights]:::men
        AssayKit[Assay Kit]:::men
        Touchstone[Touchstone]:::men
    end

    subgraph Jewelry["Wealth Storage"]
        GoldRing[Gold Rings]:::men
        SilverBracelet[Silver Bracelets]:::men
        GemBrooch[Gem Brooch]:::men
        Necklace[Fine Necklace]:::men
        Diadem[Diadem]:::men
        TreasureChest[Treasure Chest]:::men
    end
end

%% ==========================================
%% PRODUCTION CHAINS
%% ==========================================

%% === MINING TO METAL ===
IronOre --> Bloomery --> IronBloom
IronBloom --> Forge --> WroughtIron
IronBloom --> Foundry --> CastIron
WroughtIron --> Furnace --> Steel
Steel --> Forge --> DwarfSteel
Coal --> Charcoal

CopperOre --> Smelter --> CopperIngot
TinOre --> Smelter
CopperIngot --> Bronze
TinOre --> Bronze
CopperIngot --> Brass

GoldOre --> Smelter --> GoldIngot
SilverOre --> Smelter --> SilverIngot
GoldIngot --> GoldSheet
GoldIngot --> GoldWire
SilverIngot --> SilverSheet
SilverIngot --> SilverWire

Gemstones --> CutGems --> PolishedGems

%% === WOOD PROCESSING ===
OakLogs --> Sawpit --> Planks
AshLogs --> Sawpit --> Planks
YewLogs --> Sawpit --> Planks
Planks --> Carpentry --> Boards
Planks --> CooperShop --> Staves
Boards --> Lathe --> TurnedWood
Boards --> Dowels
OakLogs --> Charcoal

%% === LEATHER PROCESSING ===
Cattle --> RawHide
Pelts --> RawHide
WildGame --> RawHide
RawHide --> Tannery --> TannedLeather
WillowBark --> TannicAcid --> Tannery
TannedLeather --> CuredLeather
CuredLeather --> HardLeather
TannedLeather --> TooledLeather
Sheep --> RawHide
Goats --> RawHide
RawHide --> Vellum
RawHide --> Parchment

%% === TEXTILE ===
Wool --> SpunWool --> WovenCloth
SpunWool --> FeltedWool

%% === FOOD PROCESSING ===
Wheat --> Mill --> Flour
Oats --> Mill --> OatMeal
Barley --> Mill --> BarleyMalt
BarleyMalt --> Brewery --> Yeast

MilkRaw --> DairyHouse --> Cream
Cream --> ButterChurn --> Butter
MilkRaw --> DairyHouse --> Curds

Pigs --> SaltedMeat
Cattle --> SaltedMeat
SaltedMeat --> Smokehouse --> SmokedMeat
Pigs --> Lard
Cattle --> Tallow
Pigs --> Smokehouse --> Bacon
Pigs --> Smokehouse --> Ham
Pigs --> SausageFunnel --> Sausage

Apples --> DriedFruit
Pears --> DriedFruit
Plums --> DriedFruit
Apples --> FruitPreserve
Pears --> FruitPreserve
Grapes --> FruitPreserve
Onions --> PickledVeg
Cabbages --> PickledVeg
Carrots --> PickledVeg
HerbGarden --> HerbBundle
WildHerbs --> HerbBundle
HerbBundle --> SpiceMix

Flour --> Pastry
Butter --> Pastry
Eggs --> Custard
Cream --> Custard

PipeWeed --> Smokehouse --> CuredPipeWeed

%% === CHEMICAL ===
Beeswax --> Wax
TreeResin --> Oil
Charcoal --> Ink
Oil --> Ink

%% === GLASS & CERAMIC ===
Sand --> GlassWorks --> ClearGlass
Clay --> Kiln --> FiredClay
FiredClay --> Stoneware

%% ==========================================
%% TOOL PRODUCTION
%% ==========================================

WroughtIron --> Anvil
Steel --> SmithHammer
Steel --> Tongs
TannedLeather --> Bellows
WroughtIron --> Bellows
FiredClay --> Crucible
Steel --> DrawPlate
Steel --> FilesRasps
Steel --> Chisel
Staves --> QuenchTrough
WroughtIron --> QuenchTrough
Stone --> GrindWheel
WovenCloth --> PolishWheel
Steel --> DieCutter
Steel --> CoinPress
Bronze --> Scales
Bronze --> Weights

Steel --> WoodAxe
AshLogs --> WoodAxe
Steel --> Saw
Boards --> Plane
Steel --> Plane
Steel --> WoodChisel
Boards --> Lathe
WroughtIron --> Lathe
Boards --> Clamps
WroughtIron --> Clamps
OakLogs --> Mallet
Steel --> DrawKnife

WroughtIron --> Plough
Steel --> Scythe
AshLogs --> Scythe
Steel --> Sickle
WroughtIron --> Hoe
WroughtIron --> Rake
AshLogs --> Rake
WroughtIron --> Pitchfork
Boards --> Flail
TannedLeather --> Flail
WillowBark --> Winnow

Steel --> Pickaxe
AshLogs --> Pickaxe
Steel --> MiningHammer
Steel --> Wedges
Brass --> Lantern
ClearGlass --> Lantern
Boards --> OreCart
WroughtIron --> OreCart
WroughtIron --> Sieve

CopperIngot --> CookPot
CastIron --> Cauldron
CastIron --> Skillet
WroughtIron --> Spit
Steel --> KitchenKnife
Steel --> Cleaver
TurnedWood --> RollingPin
Stoneware --> MixingBowls
Stone --> Mortar
Staves --> ButterChurn
Boards --> CheeseMold
CopperIngot --> SausageFunnel
ClearGlass --> PreservingJar
CopperIngot --> BakingTins
Stoneware --> PieDish

Boards --> TanningRack
Steel --> FleshingKnife
Steel --> Awl
Boards --> StitchPony

Feathers --> QuillPen
Stoneware --> InkWell
Bronze --> WaxSeal
Boards --> BookPress
WroughtIron --> BookPress

%% === FACILITY CONSTRUCTION ===
Stone --> Forge
WroughtIron --> Forge
Bellows --> Forge
Stone --> Smelter
FiredClay --> Smelter
Stone --> Furnace
WroughtIron --> Furnace
Bellows --> Furnace
Stone --> Bloomery
FiredClay --> Bloomery
Stone --> Foundry
CastIron --> Foundry
Stone --> Mill
Boards --> Mill
Stone --> Bakery
FiredClay --> Bakery
Staves --> Brewery
CopperIngot --> Brewery
CopperIngot --> Distillery
Boards --> Distillery
Boards --> Smokehouse
Stone --> Smokehouse
Stone --> DairyHouse
Boards --> DairyHouse
Stone --> Kitchen
FiredClay --> Kitchen
Stone --> CellarStore
Stone --> WineCellar
Staves --> WineCellar
Boards --> Sawpit
Boards --> Carpentry
Boards --> CooperShop
Stone --> Tannery
Staves --> Tannery
Stone --> Mint
Steel --> Mint
Stone --> Vault
Steel --> Vault
Boards --> CountingHouse
Stone --> CountingHouse
Stone --> GlassWorks
FiredClay --> GlassWorks
Stone --> Kiln
FiredClay --> Kiln
Boards --> Scriptorium
ClearGlass --> Scriptorium

%% ==========================================
%% HOBBIT FOOD PRODUCTION
%% ==========================================

Flour --> Bakery --> Loaf
Flour --> Bakery --> SeedBread
Flour --> Honey --> HoneyBread
OatMeal --> Bakery --> OatCakes
Flour --> Cream --> Scones
Flour --> Bakery --> Muffins
Butter --> Bakery --> Biscuits
Flour --> Bakery --> Rolls

Pastry --> Kitchen --> MeatPie
SmokedMeat --> MeatPie
Pastry --> Kitchen --> PorkPie
Bacon --> PorkPie
Pastry --> Kitchen --> ChickenPie
Chickens --> ChickenPie
Pastry --> Kitchen --> ShepherdPie
Potatoes --> ShepherdPie
Pastry --> Kitchen --> ApplePie
Apples --> ApplePie
Pastry --> Kitchen --> PearTart
Pears --> PearTart
Custard --> Kitchen --> CustardTart
Pastry --> CustardTart
Flour --> Bakery --> SeedCake
DriedFruit --> Bakery --> FruitCake
Honey --> Bakery --> HoneyCake

Curds --> DairyHouse --> SoftCheese
Curds --> CellarStore --> AgedCheddar
Curds --> CellarStore --> BlueCheese
Goats --> MilkRaw --> GoatCheese
Curds --> Smokehouse --> SmokedCheese
Curds --> HerbBundle --> HerbCheese
Curds --> Wax --> WaxedWheel

BarleyMalt --> Brewery --> Ale
Hops --> Ale
BarleyMalt --> Brewery --> StrongAle
BarleyMalt --> Brewery --> DarkPorter
Apples --> Brewery --> AppleCider
Pears --> Brewery --> PearPerry
Honey --> Brewery --> Mead
Grapes --> WineCellar --> BerryWine
Grapes --> WineCellar --> GrapeWine
GrapeWine --> Distillery --> Brandy
HerbBundle --> Kitchen --> HerbTea

FruitPreserve --> PreservingJar --> JamJar
Apples --> PreservingJar --> Marmalade
PickledVeg --> PreservingJar --> Pickles
Apples --> PreservingJar --> Chutney
SmokedMeat --> PreservingJar --> PottedMeat
Geese --> Kitchen --> Confit
Lard --> Confit

SmokedMeat --> Kitchen --> Stew
Potatoes --> Stew
Cattle --> Kitchen --> Roast
Sausage --> Kitchen --> Sausages
Pigs --> Kitchen --> BlackPudding
Mushrooms --> Kitchen --> FriedMushrooms
Potatoes --> Kitchen --> PotatoCakes
Stock --> Kitchen --> Gravy

CuredPipeWeed --> LongBottom
CuredPipeWeed --> SpiceMix --> OldToby
CuredPipeWeed --> SouthernStar

%% ==========================================
%% DWARF SWORD PRODUCTION
%% ==========================================

DwarfSteel --> Forge --> RoughBlade
RoughBlade --> ShapedBlade
ShapedBlade --> QuenchTrough --> TemperedBlade
TemperedBlade --> GrindWheel --> GroundBlade
GroundBlade --> PolishWheel --> PolishedBlade
PolishedBlade --> MasterBlade
Steel --> WroughtIron --> PatternWeld
PatternWeld --> Forge --> DamascusBlade

PolishedBlade --> TangFit
Steel --> CrossGuard
Steel --> Quillon
Bronze --> Pommel
TurnedWood --> GripCore
TannedLeather --> LeatherWrap
GoldWire --> WireWrap
SilverWire --> WireWrap
CrossGuard --> PolishedGems --> DecorativeGuard
Pommel --> PolishedGems --> JeweledPommel

Boards --> WoodCore
WoodCore --> TannedLeather --> LeatherSheath
Brass --> MetalThroat
Brass --> Chape
TannedLeather --> BeltLoop
LeatherSheath --> TooledLeather --> DecoratedScabbard
DecoratedScabbard --> GoldSheet --> MasterScabbard

TangFit --> GripCore --> LeatherWrap --> CrossGuard --> Pommel --> Shortsword
MasterBlade --> DecorativeGuard --> JeweledPommel --> Longsword
MasterBlade --> Broadsword
MasterBlade --> Bastard
MasterBlade --> Greatsword
PolishedBlade --> Falchion
PatternWeld --> Rapier
DamascusBlade --> GoldSheet --> CeremonialBlade
DamascusBlade --> RuneBlade
MasterBlade --> JeweledPommel --> MasterScabbard --> KingsBlade
DamascusBlade --> JeweledPommel --> MasterScabbard --> AncestorBlade

Oil --> SwordOil
WovenCloth --> PolishCloth
Stone --> SharpenStone
Oil --> RepairKit
SharpenStone --> RepairKit
PolishCloth --> RepairKit

%% ==========================================
%% BANKING PRODUCTION
%% ==========================================

CopperIngot --> DieCutter --> CoinPress --> Mint --> CopperCoin
SilverIngot --> Mint --> SilverCoin
GoldIngot --> Mint --> GoldCrown
GoldIngot --> Foundry --> TradeBars
SilverIngot --> Foundry --> TradeBars
Bronze --> Mint --> MerchantToken
GoldIngot --> Mint --> GuildMedal

Parchment --> Ink --> Scriptorium --> Ledger
Vellum --> Ink --> Scriptorium --> DeedTitle
Parchment --> Scriptorium --> BondPaper
Parchment --> Scriptorium --> TradeContract
Vellum --> Scriptorium --> LetterCredit
Parchment --> Scriptorium --> BillLading
Vellum --> Scriptorium --> InsuranceWrit
Parchment --> Scriptorium --> TaxRecord
Vellum --> WaxSeal --> WillTestament
Vellum --> WaxSeal --> GuildCharter
Vellum --> GoldSheet --> RoyalWrit
Parchment --> WaxSeal --> MerchantLicense

WroughtIron --> Forge --> Strongbox
Steel --> Vault --> VaultDoor
WroughtIron --> LockBox
Bronze --> KeySet
Wax --> Pigments --> WaxSeals
GoldIngot --> SignetRing
PolishedGems --> SignetRing
Vellum --> Ink --> CipherBook

Brass --> Scales --> GoldScales
ClearGlass --> GemLoupe
Boards --> CountingBoard
TurnedWood --> Abacus
Brass --> Abacus
Bronze --> StandardWeights
Steel --> AssayKit
Stone --> Touchstone

GoldWire --> GoldRing
PolishedGems --> GoldRing
SilverWire --> SilverBracelet
GoldSheet --> PolishedGems --> GemBrooch
GoldWire --> SilverWire --> PolishedGems --> Necklace
GoldSheet --> PolishedGems --> Diadem
Boards --> WroughtIron --> TooledLeather --> TreasureChest
```