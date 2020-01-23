import { AppPage } from './app.po';

describe('new App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });
  describe('default screen', () => {
    beforeEach(() => {
      page.navigateTo('/pair');
    });
    it('should have a title saying Pair', () => {
      page.getPageOneTitleText().then(title => {
        expect(title).toEqual('Pair');
      });
    });
  });
});
