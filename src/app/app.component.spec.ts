import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from './core/services/user.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const mockNotificationService = { connect: jasmine.createSpy('connect') };
    const mockUserService = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ subscribe: () => {} }),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideComponent(AppComponent, {
        set: {
          providers: [{ provide: UserService, useValue: mockUserService }],
        },
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'esprit-smart-recruit' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('esprit-smart-recruit');
  });
});
