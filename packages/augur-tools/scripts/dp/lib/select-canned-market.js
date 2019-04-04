import cannedMarketsData from '../data/canned-markets';

function selectCannedMarket(description, marketType) {
  return cannedMarketsData.find(cannedMarketData => cannedMarketData._description === description && cannedMarketData.marketType === marketType);
}

export default selectCannedMarket;
